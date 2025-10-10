# Pause and Resume Functionality - Type-Safe Implementation

## Overview

The `ian/pause` branch now has **fully type-safe pause and resume functionality** for workflows, matching the original specification.

## How It Works

### Pause

When a workflow encounters a pause point, it:

1. Creates a step with `functionType: "pause"`
2. Optionally executes an `onPause` mutation with the `workflowId` automatically injected
3. Stores the `returnsValidator` for runtime type checking
4. Marks the step as `inProgress: true` and keeps it in that state
5. Logs a `stepPaused` event
6. Stops workflow execution at that point

### Resume

When you call `workflow.resume()`, it:

1. Validates the workflow handle matches (type safety)
2. Finds the paused step by name (or first paused step if no name)
3. Validates the `returnsValidator` matches between pause and resume
4. Marks the step as completed with the provided `resumeValue`
5. Logs a `stepResumed` event
6. Re-enqueues the workflow to continue execution from that point

## API

### Pause in Workflow

```typescript
// Simple pause without handler
const result = await step.pause({
  name: "waitForApproval",
  returns: v.object({
    approved: v.boolean(),
    approver: v.string(),
  }),
});

// Pause with onPause handler - workflowId is automatically injected
const result = await step.pause({
  name: "waitForPayment",
  onPause: internal.payments.recordPendingPayment,
  args: { orderId: order._id, amount: 100 },
  returns: v.object({
    paymentId: v.string(),
    status: v.string(),
  }),
});
```

### onPause Handler Signature

The `onPause` handler receives `workflowId` automatically:

```typescript
export const recordPendingPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    workflowId: vWorkflowId, // Automatically injected by pause
  },
  handler: async (ctx, args) => {
    // Store the workflowId for later resuming
    await ctx.db.insert("pendingPayments", {
      orderId: args.orderId,
      amount: args.amount,
      workflowId: args.workflowId,
      status: "pending",
    });
  },
});
```

### Resume from External Mutation

```typescript
import { workflow } from "./example";

export const approveWorkflow = internalMutation({
  args: {
    workflowId: vWorkflowId,
    approved: v.boolean(),
    approver: v.string(),
  },
  handler: async (ctx, args) => {
    // Type-safe resume with validator matching
    await workflow.resume(
      ctx,
      internal.workflows.myWorkflow, // Workflow reference for type safety
      args.workflowId,
      {
        approved: args.approved,
        approver: args.approver,
      },
      {
        // Same validator as used in pause
        returns: v.object({
          approved: v.boolean(),
          approver: v.string(),
        }),
        name: "waitForApproval", // Optional: specify which pause to resume
      },
    );
  },
});
```

## Type Safety Features

### 1. Workflow Reference Validation

```typescript
// ✅ Correct - workflow handle matches
await workflow.resume(
  ctx,
  internal.workflows.orderWorkflow, // Must match the actual workflow
  workflowId,
  result,
);

// ❌ Error - workflow handle mismatch
await workflow.resume(
  ctx,
  internal.workflows.differentWorkflow, // Wrong workflow!
  workflowId,
  result,
);
```

### 2. Runtime Validator Matching

```typescript
// In workflow:
const approval = await step.pause({
  name: "approval",
  returns: v.object({ approved: v.boolean() }),
});

// When resuming:
await workflow.resume(ctx, workflow, workflowId, result, {
  returns: v.object({ approved: v.boolean() }), // ✅ Matches!
});

await workflow.resume(ctx, workflow, workflowId, result, {
  returns: v.object({ approved: v.string() }), // ❌ Validator mismatch error!
});
```

### 3. Name-based Step Matching

```typescript
// Multiple pause points in workflow
const payment = await step.pause({
  name: "waitForPayment",
  returns: v.object({ paymentId: v.string() }),
});

const shipping = await step.pause({
  name: "waitForShipping",
  returns: v.object({ trackingNumber: v.string() }),
});

// Resume specific step by name
await workflow.resume(ctx, workflow, workflowId, result, {
  name: "waitForPayment", // Resumes the payment pause
  returns: v.object({ paymentId: v.string() }),
});

// Resume first outstanding pause if no name provided
await workflow.resume(ctx, workflow, workflowId, result, {
  returns: v.object({ paymentId: v.string() }),
});
```

## Complete Example

```typescript
import { v } from "convex/values";
import { WorkflowManager, vWorkflowId } from "@convex-dev/workflow";
import { internal } from "./_generated/api.js";
import { internalMutation } from "./_generated/server.js";
import { components } from "./_generated/api.js";

export const workflow = new WorkflowManager(components.workflow);

// Define the workflow
export const orderWorkflow = workflow.define({
  args: {
    orderId: v.id("orders"),
    customerId: v.string(),
  },
  handler: async (step, args) => {
    // Step 1: Validate order
    const order = await step.runQuery(internal.orders.getOrder, {
      orderId: args.orderId,
    });

    // Step 2: Pause for payment with onPause handler
    console.log("Waiting for payment...");
    const payment = await step.pause({
      name: "waitForPayment",
      onPause: internal.payments.recordPendingPayment,
      args: { orderId: args.orderId, amount: order.total },
      returns: v.object({
        paymentId: v.string(),
        status: v.literal("completed"),
      }),
    });

    // Step 3: Process order after payment
    await step.runMutation(internal.orders.processOrder, {
      orderId: args.orderId,
      paymentId: payment.paymentId,
    });

    // Step 4: Pause for shipping confirmation (no handler)
    const shipping = await step.pause({
      name: "waitForShipping",
      returns: v.object({
        trackingNumber: v.string(),
        carrier: v.string(),
      }),
    });

    // Step 5: Complete order
    await step.runMutation(internal.orders.completeOrder, {
      orderId: args.orderId,
      trackingNumber: shipping.trackingNumber,
    });

    return {
      orderId: args.orderId,
      status: "completed",
      trackingNumber: shipping.trackingNumber,
    };
  },
});

// onPause handler - receives workflowId automatically
export const recordPendingPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    workflowId: vWorkflowId, // Injected automatically
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pendingPayments", {
      orderId: args.orderId,
      amount: args.amount,
      workflowId: args.workflowId,
      status: "pending",
    });
  },
});

// Resume when payment completes
export const handlePaymentComplete = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("pendingPayments")
      .filter((q) => q.eq(q.field("orderId"), args.orderId))
      .first();

    if (!pending) {
      throw new Error("Pending payment not found");
    }

    // Type-safe resume with validator
    await workflow.resume(
      ctx,
      internal.workflows.orderWorkflow,
      pending.workflowId,
      {
        paymentId: args.paymentId,
        status: "completed" as const,
      },
      {
        name: "waitForPayment",
        returns: v.object({
          paymentId: v.string(),
          status: v.literal("completed"),
        }),
      },
    );

    // Clean up
    await ctx.db.delete(pending._id);
  },
});

// Resume when shipping confirms
export const handleShippingConfirmed = internalMutation({
  args: {
    workflowId: vWorkflowId,
    trackingNumber: v.string(),
    carrier: v.string(),
  },
  handler: async (ctx, args) => {
    await workflow.resume(
      ctx,
      internal.workflows.orderWorkflow,
      args.workflowId,
      {
        trackingNumber: args.trackingNumber,
        carrier: args.carrier,
      },
      {
        name: "waitForShipping",
        returns: v.object({
          trackingNumber: v.string(),
          carrier: v.string(),
        }),
      },
    );
  },
});
```

## Implementation Details

### Changes Made

1. **Updated Step Schema** (`src/component/schema.ts`):
   - Added `returnsValidator` field to store validator for runtime checking

2. **Updated Pause Implementation** (`src/client/stepContext.ts`):
   - Stores validator with the step
   - Uses function name as default step name
   - Injects `workflowId` into `onPause` handler args

3. **Updated Resume Mutation** (`src/component/journal.ts`):
   - Accepts `workflowHandle` for validation
   - Accepts `returnsValidator` for runtime checking
   - Accepts `name` for step matching
   - Validates workflow handle matches
   - Validates return value validator matches
   - Finds paused step by name or returns first

4. **Updated Resume API** (`src/client/index.ts`):
   - Accepts workflow function reference
   - Accepts optional `returns` validator
   - Accepts optional `name` for step matching
   - Creates function handle for type safety

### Key Code Locations

- Pause implementation: `src/client/stepContext.ts:45-92`
- Pause step handling: `src/component/pool.ts:117-128`
- Resume mutation: `src/component/journal.ts:162-241`
- Resume method: `src/client/index.ts:208-235`
- Step schema: `src/component/schema.ts:62-74`

## Status

✅ **Pause** - Fully implemented with type safety
✅ **Resume** - Fully implemented with type safety
✅ **Workflow Reference** - Validates correct workflow
✅ **Validator Matching** - Runtime validation
✅ **Name-based Matching** - Find pause by name
✅ **workflowId Injection** - Automatically passed to onPause
✅ **Build** - Successful
✅ **Linting** - Passed

## Error Messages

The implementation provides clear error messages:

- **No paused step**: `"No paused step found for workflow: {workflowId}"`
- **No paused step with name**: `"No paused step with name "{name}" found for workflow: {workflowId}"`
- **Workflow handle mismatch**: `"Workflow handle mismatch: expected {expected}, got {actual}"`
- **Validator mismatch**: `"Validator mismatch for step "{stepName}": expected {expected}, got {provided}"`
- **Workflow not running**: `"Workflow not running: {workflowId}"`

## Best Practices

1. **Always provide validators** - Use the `returns` parameter in both `pause` and `resume` for type safety
2. **Use meaningful names** - Name your pause points for clarity when resuming
3. **Store workflowId** - In `onPause` handlers, store the `workflowId` for later resuming
4. **Share validators** - Extract validators to constants to ensure they match:

```typescript
const approvalValidator = v.object({
  approved: v.boolean(),
  approver: v.string(),
});

// In workflow
const approval = await step.pause({
  name: "approval",
  returns: approvalValidator,
});

// When resuming
await workflow.resume(ctx, workflow, workflowId, result, {
  name: "approval",
  returns: approvalValidator,
});
```
