# Event-Driven Workflow Enhancements Spec

## Summary
- **Add topic-based event publishing** so apps can fan out events into dedicated workflow instances.
- **Provide type-safe APIs** in the `WorkflowManager` client for defining events, registering workflows, and publishing payloads.
- **Persist event metadata** to support retries, observability, and backfills when no listeners are available.
- **Automatic completion tracking** via existing `onComplete` hooks to reduce manual state management.

## Goals
- **Typed topics**: Developers define events with Convex validators, ensuring compile-time and runtime payload safety.
- **Type-safe handler registration**: Compile-time verification that workflow args match event payload structure.
- **Fan-out workflows**: Publishing an event starts a fresh workflow instance for each registered handler.
- **Durable storage**: Events are stored with status tracking for replay, retries, and failure inspection.
- **Minimal integration friction**: Usage mirrors existing `workflow.define()` ergonomics and works in HTTP, mutations, and actions.
- **Production-ready**: Built-in support for idempotency, backpressure, and event replay.

## Non-Goals
- **Full message bus parity** (e.g. strict FIFO ordering guarantees, partition shuffling) beyond our basic fan-out with optional per-entity ordering.
- **Automatic dead-letter queue** (we expose hooks for marking failures; apps can layer their own DLQ logic).
- **External transport integrations** like SNS/SQS (all dispatch remains inside Convex).

## User Stories
- **As an application developer**, I can define an event topic with a schema so that publishing invalid payloads fails fast.
- **As a backend engineer**, I can register multiple workflows to a topic and the compiler verifies that workflow args match event payload structure.
- **As an operator**, I can inspect stored events and retry or replay those that failed or were published without subscribers.
- **As an integrator**, I can publish events from `httpAction` handlers (e.g. Clerk webhooks) without reimplementing validation logic.
- **As a workflow author**, I receive event payloads as typed arguments without manually tracking event completion.

## Acceptance Criteria
- **AC1**: Defining an event via `WorkflowManager.defineEvent({ name, validator })` infers the payload type and validates at runtime.
- **AC2**: Calling `WorkflowManager.defineEvent({ name, validator, handlers: [...] })` type-checks that each handler's args match the event payload at compile time.
- **AC3**: Publishing from mutations/actions/HTTP via `WorkflowManager.events.publish(ctx, eventDef, payload)` inserts an event row, validates payload, deduplicates via idempotency key, and starts a workflow instance per registration.
- **AC4**: `events` table records `status`, `retryCount`, `lastError`, `idempotencyKey`, and timestamps; event completion is automatically tracked via workflow `onComplete` hooks.
- **AC5**: If no handlers exist, the event remains in `status="pending"` and can be replayed later via `events.replay` mutation.
- **AC6**: `eventWorkflows` table tracks which workflow instances were spawned for each event, enabling per-workflow status queries.
- **AC7**: Documentation in `packages/convex-workflow/README.md` covers setup, API usage, idempotency, and replay guidance.

## Proposed Changes

### Schema (`packages/convex-workflow/src/component/schema.ts`)

#### New Tables

**`topics` table**
- Fields:
  - `name: v.string()` (unique topic identifier)
  - `validator: v.any()` (Convex validator stored via convexToJson - follows signals pattern)
  - `createdAt: v.number()`
- Index: `by_name` on `name`

**`topicRegistrations` table**
- Fields:
  - `topicId: v.id("topics")`
  - `workflowHandle: v.string()` (serialized function handle)
  - `createdAt: v.number()`
- Index: `by_topic` on `topicId`

**`events` table**
- Fields:
  - `topicId: v.id("topics")`
  - `payload: v.any()`
  - `status: literals("pending", "dispatching", "completed", "failed")`
  - `retryCount: v.number()`
  - `lastError: v.optional(v.string())`
  - `idempotencyKey: v.optional(v.string())` (for deduplication)
  - `metadata: v.optional(v.any())` (stores options like source, traceId, etc.)
  - `createdAt: v.number()`
  - `completedAt: v.optional(v.number())`
- Indexes:
  - `by_topic_status` on `[topicId, status]`
  - `by_status` on `status`
  - `by_idempotency` on `[topicId, idempotencyKey]` (for deduplication)

**`eventWorkflows` table** (NEW - tracks event → workflow relationship)
- Fields:
  - `eventId: v.id("events")`
  - `workflowId: v.id("workflows")`
  - `workflowHandle: v.string()` (which handler processed this)
  - `status: literals("pending", "running", "completed", "failed", "canceled")`
  - `createdAt: v.number()`
  - `completedAt: v.optional(v.number())`
- Indexes:
  - `by_event` on `eventId`
  - `by_workflow` on `workflowId`
  - `by_event_status` on `[eventId, status]`

### Component Server APIs (`packages/convex-workflow/src/component/events.ts`)

#### Core Mutations

**`defineTopic` (mutation)**
- Args: `{ name: v.string(), validator: v.any() }`
- Upserts topic definition (idempotent)
- Validates validator is a valid Convex validator
- Returns: `topicId`

**`registerWorkflow` (mutation)**
- Args: `{ topicId: v.id("topics"), workflowHandle: v.string() }`
- Inserts into `topicRegistrations` (idempotent - checks for existing registration)
- Returns: `void`

**`unregisterWorkflow` (mutation)**
- Args: `{ topicId: v.id("topics"), workflowHandle: v.string() }`
- Removes registration
- Returns: `boolean` (whether anything was deleted)

**`publishEvent` (mutation)**
- Args: `{ topicId: v.id("topics"), payload: v.any(), idempotencyKey: v.optional(v.string()), metadata: v.optional(v.any()) }`
- **Idempotency check**: If `idempotencyKey` provided, check for duplicate event
- Validates payload against topic's validator
- Records event with `status="dispatching"`
- Fetches all `topicRegistrations` for this topic
- For each registration:
  - Calls `workflow.start()` with automatic `onComplete` handler
  - Inserts into `eventWorkflows` table with `status="pending"`
- Updates event `status="completed"` if all workflows started successfully
- Updates event `status="failed"` if any workflow failed to start
- Returns: `{ eventId, workflowIds: [] }`

**`markWorkflowCompleted` (internal mutation)**
- Args: `{ workflowId: v.id("workflows"), result: vResultValidator, context: v.any() }`
- Called automatically by workflow `onComplete` hook
- Updates `eventWorkflows` status based on result.kind
- Checks if all workflows for an event are complete, updates event status accordingly
- Returns: `void`

**`replayEvent` (mutation)**
- Args: `{ eventId: v.id("events"), workflowHandle: v.optional(v.string()) }`
- Re-dispatches a pending/failed event to all (or specific) handlers
- Creates new workflow instances, updates `eventWorkflows` table
- Returns: `{ workflowIds: [] }`

#### Query APIs

**`listPendingEvents` (query)**
- Args: `{ topicId: v.optional(v.id("topics")), limit: v.optional(v.number()) }`
- Returns pending/failed events for monitoring or manual replay
- Returns: `{ events: [], count: number }`

**`listEventsByTopic` (query)** (NEW)
- Args: `{ topicId: v.id("topics"), status: v.optional(literals(...)), limit: v.optional(v.number()) }`
- Returns events filtered by topic and optional status
- Returns: `{ events: [] }`

**`getEventStatus` (query)**
- Args: `{ eventId: v.id("events") }`
- Returns full event details including all workflow statuses
- Returns: `{ event, workflows: [] }`


### Client APIs (`packages/convex-workflow/src/client/index.ts`)

#### Type Definitions

```ts
export type EventDefinition<
  PayloadValidator extends PropertyValidators,
  Payload extends ObjectType<PayloadValidator> = ObjectType<PayloadValidator>
> = {
  name: string;
  validator: ObjectType<PayloadValidator>;
  _payload?: Payload; // Type inference helper
};

export type DefinedEvent<
  PayloadValidator extends PropertyValidators,
  Payload extends ObjectType<PayloadValidator> = ObjectType<PayloadValidator>
> = {
  name: string;
  validator: ObjectType<PayloadValidator>;
  _payload?: Payload;
  _topicId?: string; // Set after registration
};

// Helper type to extract payload from event
export type EventPayload<E extends DefinedEvent<any>> =
  E extends DefinedEvent<infer V> ? ObjectType<V> : never;

// Type to ensure workflow args match event payload
export type EventHandler<E extends DefinedEvent<any>> =
  E extends DefinedEvent<infer PayloadValidator>
    ? FunctionReference<
        "mutation",
        "internal",
        ObjectType<PayloadValidator>,
        any
      >
    : never;
```

#### API Methods

**`WorkflowManager.defineEvent<PayloadValidator>({ name, validator, handlers? })`**
- Defines an event with optional declarative handler registration
- Type-checks that handlers' args match payload structure
- Returns: `DefinedEvent<PayloadValidator>`
- **Compile-time safety**: TypeScript ensures handlers accept the correct payload shape

```ts
// Type-safe signature
defineEvent<PayloadValidator extends PropertyValidators>(
  config: {
    name: string;
    validator: ObjectType<PayloadValidator>;
    handlers?: Array<EventHandler<DefinedEvent<PayloadValidator>>>;
  }
): DefinedEvent<PayloadValidator>
```

**`WorkflowManager.events.publish(ctx, eventDef, payload, options?)`**
- Args:
  - `ctx: RunMutationCtx`
  - `eventDef: DefinedEvent<T>`
  - `payload: T` (inferred from event)
  - `options?: { idempotencyKey?: string, metadata?: any }`
- Validates payload and calls component mutation
- Returns: `Promise<{ eventId: string, workflowIds: string[] }>`

**`WorkflowManager.events.replay(ctx, eventId, options?)`**
- Args:
  - `ctx: RunMutationCtx`
  - `eventId: string`
  - `options?: { workflowHandle?: string }` (replay to specific handler only)
- Returns: `Promise<{ workflowIds: string[] }>`

**`WorkflowManager.events.listPending(ctx, topicName?, limit?)`**
- Returns: `Promise<Event[]>`

**`WorkflowManager.events.getStatus(ctx, eventId)`**
- Returns: `Promise<{ event: Event, workflows: EventWorkflow[] }>`

### Event Lifecycle

#### 1. Event Definition (Declarative)
Developer defines event with handlers at definition time:

```ts
// convex/events.ts
export const userCreatedEvent = workflows.defineEvent({
  name: "user.created",
  validator: v.object({
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
  }),
  handlers: [
    internal.workflows.sendWelcomeEmail.mutation,
    internal.workflows.createUserProfile.mutation,
    internal.workflows.notifyAdmins.mutation,
  ],
});
```

**Type Safety**: The compiler checks that each handler mutation has args matching:
```ts
{ userId: string, email: string, name: string }
```

#### 2. Event Registration (Automatic)
On first publish, the system automatically registers handlers declared in `defineEvent`. No manual registration step needed!

#### 3. Event Publishing
```ts
// convex/http.ts or any mutation/action
const result = await workflows.events.publish(ctx, userCreatedEvent, {
  userId: "user123",
  email: "user@example.com",
  name: "John Doe",
}, {
  idempotencyKey: `clerk-${webhookId}`, // Prevents duplicate processing
  metadata: { source: "clerk", webhookId },
});

// result = { eventId: "eventId123", workflowIds: ["wf1", "wf2", "wf3"] }
```

**Idempotency**: If the same `idempotencyKey` is used, returns the existing event without creating workflows.

#### 4. Workflow Execution (Automatic Tracking)
Each handler is started automatically with `onComplete` hook:

```ts
export const { mutation: sendWelcomeEmail } = workflows.define({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
  },
  handler: async (step, { userId, email, name }) => {
    // No need to pass eventId, topic, etc - just the payload!

    await step.runAction(internal.email.send, {
      to: email,
      subject: `Welcome ${name}!`,
      template: "welcome",
    });

    // NO need to call markCompleted - handled automatically!
  },
});
```

**Automatic Completion**: The workflow system automatically calls `markWorkflowCompleted` via the injected `onComplete` handler.

#### 5. Event Completion
When all workflows for an event complete, the event status is automatically updated to `completed`.

#### 6. Monitoring & Replay
```ts
// Query pending events
const pending = await workflows.events.listPending(ctx, "user.created");

// Replay failed event
await workflows.events.replay(ctx, eventId);

// Get detailed status
const status = await workflows.events.getStatus(ctx, eventId);
// status = {
//   event: { status: "completed", ... },
//   workflows: [
//     { workflowHandle: "...", status: "completed" },
//     { workflowHandle: "...", status: "failed", lastError: "..." },
//   ]
// }
```

### Usage Examples

#### Example 1: Type-Safe Event Definition with Handlers

```ts
// convex/events.ts
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";
import { internal } from "./_generated/api";

export const workflows = new WorkflowManager(components.workflow);

// Define event with handlers - all type-checked!
export const orderPlacedEvent = workflows.defineEvent({
  name: "order.placed",
  validator: v.object({
    orderId: v.id("orders"),
    userId: v.id("users"),
    total: v.number(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
  }),
  handlers: [
    internal.workflows.processPayment.mutation,      // ✅ Type-checked
    internal.workflows.updateInventory.mutation,     // ✅ Type-checked
    internal.workflows.sendOrderConfirmation.mutation, // ✅ Type-checked
    // internal.workflows.wrongHandler.mutation,     // ❌ Compile error if args don't match!
  ],
});
```

#### Example 2: Publishing from HTTP Action

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { workflows, orderPlacedEvent } from "./events";

const http = httpRouter();

http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    // Verify webhook...
    const event = stripe.webhooks.constructEvent(body, signature, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Publish event with idempotency
      await workflows.events.publish(
        ctx,
        orderPlacedEvent,
        {
          orderId: session.metadata.orderId,
          userId: session.metadata.userId,
          total: session.amount_total / 100,
          items: JSON.parse(session.metadata.items),
        },
        {
          idempotencyKey: `stripe-${event.id}`, // Prevents duplicate processing
          metadata: {
            source: "stripe",
            eventId: event.id,
            sessionId: session.id,
          },
        }
      );
    }

    return new Response("ok");
  }),
});

export default http;
```

#### Example 3: Workflow Handlers (Clean & Simple)

```ts
// convex/workflows.ts
import { workflows } from "./events";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Handler 1: Process Payment
export const { mutation: processPayment } = workflows.define({
  args: {
    orderId: v.id("orders"),
    userId: v.id("users"),
    total: v.number(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
  },
  handler: async (step, { orderId, userId, total }) => {
    const paymentIntent = await step.runAction(
      internal.stripe.createPaymentIntent,
      { orderId, userId, total }
    );

    await step.runMutation(internal.orders.updatePaymentStatus, {
      orderId,
      paymentIntentId: paymentIntent.id,
      status: "processing",
    });

    // Completion is automatic!
  },
});

// Handler 2: Update Inventory
export const { mutation: updateInventory } = workflows.define({
  args: {
    orderId: v.id("orders"),
    userId: v.id("users"),
    total: v.number(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
  },
  handler: async (step, { orderId, items }) => {
    for (const item of items) {
      await step.runMutation(internal.inventory.decrementStock, {
        productId: item.productId,
        quantity: item.quantity,
        orderId,
      });
    }
  },
});

// Handler 3: Send Confirmation
export const { mutation: sendOrderConfirmation } = workflows.define({
  args: {
    orderId: v.id("orders"),
    userId: v.id("users"),
    total: v.number(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
  },
  handler: async (step, { orderId, userId }) => {
    const user = await step.runQuery(internal.users.get, { userId });
    const order = await step.runQuery(internal.orders.get, { orderId });

    await step.runAction(internal.email.sendOrderConfirmation, {
      to: user.email,
      orderDetails: order,
    });
  },
});
```

#### Example 4: Monitoring & Operations

```ts
// convex/admin.ts
import { query, mutation } from "./_generated/server";
import { workflows, orderPlacedEvent } from "./events";

export const listFailedEvents = query({
  handler: async (ctx) => {
    return await workflows.events.listPending(ctx, orderPlacedEvent.name, 50);
  },
});

export const replayFailedEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const result = await workflows.events.replay(ctx, eventId);
    return { retriedWorkflows: result.workflowIds.length };
  },
});

export const getEventDetails = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    return await workflows.events.getStatus(ctx, eventId);
  },
});
```

### Type Safety Deep Dive

The type safety for handler registration works through TypeScript's constraint system:

```ts
// In WorkflowManager class
defineEvent<PayloadValidator extends PropertyValidators>(
  config: {
    name: string;
    validator: ObjectType<PayloadValidator>;
    handlers?: Array<
      FunctionReference<"mutation", "internal", ObjectType<PayloadValidator>, any>
    >;
  }
): DefinedEvent<PayloadValidator>
{
  // Implementation...
}
/**
 * **Key mechanism**: The `handlers` array is constrained to accept only mutations where:
 * - The mutation is "internal" visibility
 * - The args type is `ObjectType<PayloadValidator>` (must match the event's payload exactly)
 * - Return type can be anything (`any`)
 */

**Example of compile-time checking**:

```ts
// ✅ This compiles - args match payload
workflows.defineEvent({
  validator: v.object({ userId: v.id("users"), email: v.string() }),
  handlers: [
    // Mutation with args: { userId: string, email: string }
    internal.workflows.sendEmail.mutation,
  ],
});

// ❌ This fails at compile time - args don't match
workflows.defineEvent({
  validator: v.object({ userId: v.id("users"), email: v.string() }),
  handlers: [
    // Mutation with args: { name: string } - WRONG!
    internal.workflows.wrongHandler.mutation, // Type error!
  ],
});
```

### Observability & Operations

#### Structured Logging
All event operations emit structured logs:
- `eventPublished`: When event is created
- `workflowDispatched`: When workflow is started for an event
- `eventCompleted`: When all workflows complete
- `eventFailed`: When event processing fails
- `eventReplayed`: When event is manually replayed

#### Monitoring Queries
Built-in queries for operational visibility:
- `listPendingEvents`: Find events that need attention
- `getEventStatus`: Detailed status for debugging
- `listEventsByTopic`: Topic-specific monitoring

#### Recommended Metrics
Document these in the README:
- Pending events count per topic
- Failed workflows per event
- Event processing time (createdAt to completedAt)
- Retry counts histogram

### Backpressure & Rate Limiting

**Backpressure mechanism**: Events leverage the existing workpool `maxParallelism` setting:
```ts
const workflows = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 20, // Limits concurrent workflows across all events
  },
});
```

**Per-topic rate limiting** (future enhancement): Could add `maxConcurrentWorkflows` per topic in `topics` table.

### Idempotency Guarantees

**Client-provided keys**: Publishers can provide `idempotencyKey` to prevent duplicate event processing:
```ts
await workflows.events.publish(ctx, event, payload, {
  idempotencyKey: `webhook-${externalId}`,
});
```

**Behavior**:
- First call: Creates event, dispatches workflows, returns `{ eventId, workflowIds }`
- Duplicate call: Returns existing `{ eventId, workflowIds }` without creating new workflows
- Keys are scoped per topic (same key on different topics creates different events)

**Implementation**: Uses unique index on `[topicId, idempotencyKey]` in events table.

### Event Replay & Retry

**Automatic retry** (future enhancement): Could add retry policies to handle transient failures automatically.

**Manual replay**: Operators can replay events via `events.replay()`:
- Replays to all handlers by default
- Can target specific handler with `workflowHandle` option
- Creates new workflow instances, preserves original event

**Use cases**:
- Replaying events that had no handlers registered yet
- Retrying after fixing a bug in handler code
- Adding a new handler and backfilling historical events

### Migration Path

**Adding handlers to existing events**:
1. Register new handler
2. Query for historical events
3. Replay events to new handler:
```ts
const events = await listEventsByTopic(ctx, "user.created");
for (const event of events) {
  await workflows.events.replay(ctx, event._id, {
    workflowHandle: newHandlerHandle,
  });
}
```

### Risks & Mitigations

**1. Validator serialization**
- **Risk**: Validators must be serializable
- **Mitigation**: Follow signals pattern - validators are JSON-serializable via `convexToJson`
- **Validation**: Add runtime check that validates stored validator can be deserialized

**2. Workflow explosion**
- **Risk**: Large fan-out may enqueue many workflows
- **Mitigation**:
  - Document recommended `maxParallelism` settings
  - Add monitoring for pending workflow counts
  - Consider per-topic concurrency limits (future)

**3. Event table growth**
- **Risk**: Unlimited event storage
- **Mitigation**:
  - Document event pruning strategies
  - Recommend cleanup jobs for completed events older than X days
  - Consider TTL support (future enhancement)

**4. Idempotency key collisions**
- **Risk**: Same key across topics could cause confusion
- **Mitigation**: Keys are scoped per topic via composite index `[topicId, idempotencyKey]`

**5. Handler registration timing**
- **Risk**: Events published before handlers registered
- **Mitigation**:
  - Declarative registration at definition time ensures handlers exist before first publish
  - Events without handlers remain in "pending" status
  - Replay mechanism allows processing once handlers are registered

**6. Circular dependencies**
- **Risk**: Event definition and handler import each other
- **Mitigation**: Define events in separate file, import into workflow file (one-way dependency)

### Open Questions

**1. Per-entity ordering**
- **Question**: Should we support FIFO ordering per user/resource?
- **Proposed approach**: Add optional `orderingKey` to events, process serially per key
- **Decision**: Defer to future enhancement - document workaround using single workflow with queue

**2. Event retention policies**
- **Question**: Auto-delete completed events after N days?
- **Proposed approach**: Add optional `ttlDays` to topic definition
- **Decision**: Document manual cleanup pattern initially, add TTL later

**3. Priority queuing**
- **Question**: Should some events process before others?
- **Proposed approach**: Add `priority` field to events, workpool already supports this
- **Decision**: Can be added later if needed

**4. Batch publishing**
- **Question**: Should we support `publishMany` for bulk events?
- **Proposed approach**: Add `events.publishMany(ctx, eventDef, payloads[])`
- **Decision**: Add in M2 if initial testing shows need

**5. Cross-event workflows**
- **Question**: Should a workflow wait for multiple events before proceeding?
- **Proposed approach**: Use existing signals mechanism with event-triggered signal resolution
- **Decision**: Out of scope - document pattern in guide

## Acceptance Test Plan

### Unit Tests (`src/component/events.test.ts`)
- ✅ `defineTopic` creates/updates topic correctly
- ✅ `registerWorkflow` associates handler with topic
- ✅ `publishEvent` validates payload against topic validator
- ✅ `publishEvent` with idempotencyKey prevents duplicates
- ✅ `publishEvent` starts workflows for all registered handlers
- ✅ `markWorkflowCompleted` updates eventWorkflows status
- ✅ Event status updates to "completed" when all workflows finish
- ✅ `replayEvent` creates new workflow instances

### Integration Tests (`src/client/events.integration.test.ts`)
- ✅ End-to-end: defineEvent → publish → workflows execute → completion tracked
- ✅ HTTP action publishes event successfully
- ✅ Multiple handlers receive same event payload
- ✅ Failed workflow doesn't block other handlers
- ✅ Idempotency prevents duplicate workflow creation

### Type Safety Tests (`src/client/events.types.test.ts`)
- ✅ Correct handler args compile successfully
- ✅ Incorrect handler args fail compilation (type-level test)
- ✅ Event payload type is inferred correctly

### Regression Tests
- ✅ Existing workflow functionality unaffected
- ✅ Signal functionality still works
- ✅ Performance benchmarks within acceptable range

## Documentation Tasks

### README Updates (`packages/convex-workflow/README.md`)
- Add "Event-Driven Workflows" section after "Signals"
- Quick start guide with type-safe handler registration
- Idempotency best practices
- Monitoring and operations examples

### Dedicated Guide (`docs/events.md`)
- Deep dive on event lifecycle
- Type safety explanation and examples
- Replay strategies
- Monitoring queries and metrics
- Migration patterns
- Troubleshooting common issues

### API Reference
- Full API documentation for all client methods
- Schema documentation for tables
- Type definitions reference

## Milestones

### M1: Core Implementation (Week 1-2)
- Schema implementation with all tables
- Component server API (events.ts)
- Basic client API without handler registration
- Unit tests for core functionality
- ✅ **Deliverable**: Events can be published and workflows started

### M2: Type Safety & Declarative Registration (Week 2-3)
- Type-safe `defineEvent` with handlers
- Compile-time handler validation
- Automatic handler registration on first publish
- Client API polish
- Integration tests
- ✅ **Deliverable**: Full type safety and ergonomic developer experience

### M3: Idempotency & Operations (Week 3-4)
- Idempotency key support
- Replay functionality
- Monitoring queries
- Structured logging
- Operations documentation
- ✅ **Deliverable**: Production-ready event system

### M4: Documentation & Examples (Week 4)
- README updates
- Dedicated events.md guide
- Example app demonstrating patterns
- Migration guide
- ✅ **Deliverable**: Public release with comprehensive docs

### M5: Release (Week 5)
- Release notes
- Blog post announcement
- Community feedback collection
- ✅ **Deliverable**: v0.3.0 release with event-driven workflows

## Success Metrics

**Adoption metrics**:
- Number of projects using event-driven workflows
- Average number of handlers per event
- Total events published per day

**Quality metrics**:
- Event processing success rate
- Average time from publish to all workflows completed
- Replay success rate

**Developer experience metrics**:
- Time to implement first event handler (should be < 10 minutes)
- Number of type errors caught at compile time
- Documentation satisfaction (survey)
