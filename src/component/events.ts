import { v } from "convex/values";
import { assert } from "convex-helpers";
import { validate, ValidationError } from "convex-helpers/validators";
import type { FunctionHandle, Query, QueryInitializer } from "convex/server";
import {
  mutation,
  query,
  type MutationCtx,
  internalMutation,
} from "./_generated/server.js";
import { api, internal } from "./_generated/api.js";
import {
  type Topic,
  type Event,
  type EventWorkflow,
  eventDocument,
  eventWorkflowDocument,
  topicDocument,
} from "./schema.js";
import { getDefaultLogger } from "./utils.js";
import { vResultValidator } from "@convex-dev/workpool";
import type { DataModel, Id } from "./_generated/dataModel.js";

/**
 * Define a topic for event publishing.
 * This is idempotent - calling it multiple times with the same name updates the validator.
 */
export const defineTopic = mutation({
  args: {
    name: v.string(),
    validator: v.any(),
  },
  returns: v.id("topics"),
  handler: async (ctx, args) => {
    const console = await getDefaultLogger(ctx);

    // Check if topic already exists
    const existing = await ctx.db
      .query("topics")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      // Update validator if changed
      await ctx.db.patch(existing._id, {
        validator: args.validator,
      });
      console.debug(`Updated topic: ${args.name}`);
      return existing._id;
    }

    // Create new topic
    const topicId = await ctx.db.insert("topics", {
      name: args.name,
      validator: args.validator,
      createdAt: Date.now(),
    });

    console.event("topicDefined", {
      topicId,
      name: args.name,
    });

    return topicId;
  },
});

/**
 * Register a workflow handler for a topic.
 * This is idempotent - registering the same handler multiple times is safe.
 */
export const registerWorkflow = mutation({
  args: {
    topicId: v.id("topics"),
    workflowHandle: v.string(),
    workflowName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const console = await getDefaultLogger(ctx);

    const topic = await ctx.db.get(args.topicId);
    assert(topic, `Topic not found: ${args.topicId}`);

    // Check if already registered (idempotent)
    const existing = await ctx.db
      .query("topicRegistrations")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .filter((q) => q.eq(q.field("workflowHandle"), args.workflowHandle))
      .first();

    if (existing) {
      console.debug(
        `Handler already registered: ${args.workflowHandle} for topic ${topic.name}`,
      );
      return null;
    }

    // Register the handler
    await ctx.db.insert("topicRegistrations", {
      topicId: args.topicId,
      workflowHandle: args.workflowHandle,
      workflowName: args.workflowName,
      createdAt: Date.now(),
    });

    console.event("workflowRegistered", {
      topicId: args.topicId,
      topicName: topic.name,
      workflowHandle: args.workflowHandle,
    });

    return null;
  },
});

/**
 * Unregister a workflow handler from a topic.
 */
export const unregisterWorkflow = mutation({
  args: {
    topicId: v.id("topics"),
    workflowHandle: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const console = await getDefaultLogger(ctx);

    const topic = await ctx.db.get(args.topicId);
    assert(topic, `Topic not found: ${args.topicId}`);

    const registration = await ctx.db
      .query("topicRegistrations")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .filter((q) => q.eq(q.field("workflowHandle"), args.workflowHandle))
      .first();

    if (!registration) {
      return false;
    }

    await ctx.db.delete(registration._id);

    console.event("workflowUnregistered", {
      topicId: args.topicId,
      topicName: topic.name,
      workflowHandle: args.workflowHandle,
    });

    return true;
  },
});

/**
 * Publish an event to a topic.
 * Validates payload, handles idempotency, and starts workflows for all registered handlers.
 */
export const publishEvent = mutation({
  args: {
    topicId: v.id("topics"),
    payload: v.any(),
    idempotencyKey: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.object({
    eventId: v.id("events"),
    workflowIds: v.array(v.id("workflows")),
  }),
  handler: async (ctx, args) => {
    const console = await getDefaultLogger(ctx);

    const topic = await ctx.db.get(args.topicId);
    assert(topic, `Topic not found: ${args.topicId}`);

    // Check for duplicate event (idempotency)
    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("events")
        .withIndex("by_idempotency", (q) =>
          q
            .eq("topicId", args.topicId)
            .eq("idempotencyKey", args.idempotencyKey),
        )
        .first();

      if (existing) {
        console.debug(
          `Duplicate event detected, returning existing: ${existing._id}`,
        );

        // Get workflow IDs for this event
        const eventWorkflows = await ctx.db
          .query("eventWorkflows")
          .withIndex("by_event", (q) => q.eq("eventId", existing._id))
          .collect();

        return {
          eventId: existing._id,
          workflowIds: eventWorkflows.map((ew) => ew.workflowId),
        };
      }
    }

    // Validate payload against topic's validator
    if (topic.validator) {
      try {
        validate(topic.validator, args.payload, { throw: true });
      } catch (error) {
        const message =
          error instanceof ValidationError ? error.message : String(error);
        throw new Error(`Event payload validation failed: ${message}`);
      }
    }

    // Create event record with "dispatching" status
    const eventId = await ctx.db.insert("events", {
      topicId: args.topicId,
      payload: args.payload,
      status: "dispatching",
      retryCount: 0,
      idempotencyKey: args.idempotencyKey,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    console.event("eventPublished", {
      eventId,
      topicId: args.topicId,
      topicName: topic.name,
      idempotencyKey: args.idempotencyKey,
    });

    // Get all registered handlers for this topic
    const registrations = await ctx.db
      .query("topicRegistrations")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    if (registrations.length === 0) {
      console.warn(`No handlers registered for topic: ${topic.name}`);
      // Mark as pending so it can be replayed later
      await ctx.db.patch(eventId, { status: "pending" });
      return { eventId, workflowIds: [] };
    }

    // Start a workflow for each registered handler
    const workflowIds: Id<"workflows">[] = [];
    let hasErrors = false;

    for (const registration of registrations) {
      try {
        const workflowName =
          registration.workflowName ??
          registration.workflowHandle.split(":").pop() ??
          "unknown";

        const workflowId = await ctx.runMutation(api.workflow.create, {
          workflowName,
          workflowHandle: registration.workflowHandle,
          workflowArgs: args.payload,
          startAsync: false,
        });

        await ctx.db.insert("eventWorkflows", {
          eventId,
          workflowId,
          workflowHandle: registration.workflowHandle,
          status: "running",
          createdAt: Date.now(),
        });

        workflowIds.push(workflowId);

        console.event("workflowDispatched", {
          eventId,
          workflowId,
          workflowHandle: registration.workflowHandle,
        });
      } catch (error) {
        hasErrors = true;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `Failed to start workflow ${registration.workflowHandle}:`,
          errorMessage,
        );

        await ctx.db.patch(eventId, {
          status: "failed",
          lastError: errorMessage,
        });
      }
    }

    // Update event status based on results
    if (!hasErrors && workflowIds.length === registrations.length) {
      // All workflows started successfully
      // Note: We mark as "dispatching" - it will be marked "completed" when all workflows finish
      await ctx.db.patch(eventId, { status: "dispatching" });
    } else if (workflowIds.length === 0) {
      // All workflows failed to start
      await ctx.db.patch(eventId, { status: "failed" });
    }

    return { eventId, workflowIds };
  },
});

/**
 * Mark an event workflow as completed.
 * This is called automatically by the workflow's onComplete handler.
 */
export const markWorkflowCompleted = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    result: vResultValidator,
    context: v.any(), // Contains { eventId }
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const console = await getDefaultLogger(ctx);

    // Context should contain eventId
    const eventId = args.context?.eventId as Id<"events"> | undefined;
    if (!eventId) {
      console.warn(`markWorkflowCompleted called without eventId in context`);
      return null;
    }

    // Find the eventWorkflow record
    const eventWorkflow = await ctx.db
      .query("eventWorkflows")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .first();

    if (!eventWorkflow) {
      console.warn(
        `EventWorkflow not found for workflowId: ${args.workflowId}`,
      );
      return null;
    }

    // Update eventWorkflow status based on result
    const status: EventWorkflow["status"] =
      args.result.kind === "success"
        ? "completed"
        : args.result.kind === "canceled"
          ? "canceled"
          : "failed";

    await ctx.db.patch(eventWorkflow._id, {
      status,
      completedAt: Date.now(),
    });

    console.event("eventWorkflowCompleted", {
      eventId: eventWorkflow.eventId,
      workflowId: args.workflowId,
      status,
    });

    // Check if all workflows for this event are complete
    await updateEventStatusIfComplete(ctx, eventWorkflow.eventId);

    return null;
  },
});

/**
 * Helper function to check if all workflows for an event are complete
 * and update the event status accordingly.
 */
async function updateEventStatusIfComplete(
  ctx: MutationCtx,
  eventId: Id<"events">,
): Promise<void> {
  const console = await getDefaultLogger(ctx);

  const eventWorkflows = await ctx.db
    .query("eventWorkflows")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();

  if (eventWorkflows.length === 0) {
    return;
  }

  // Check if all workflows are complete
  const allComplete = eventWorkflows.every(
    (ew) =>
      ew.status === "completed" ||
      ew.status === "failed" ||
      ew.status === "canceled",
  );

  if (!allComplete) {
    return;
  }

  // Determine overall event status
  const hasFailures = eventWorkflows.some((ew) => ew.status === "failed");
  const hasCanceled = eventWorkflows.some((ew) => ew.status === "canceled");

  const event = await ctx.db.get(eventId);
  if (!event) {
    return;
  }

  const newStatus: Event["status"] = hasFailures
    ? "failed"
    : hasCanceled
      ? "failed" // Treat cancellations as failures
      : "completed";

  await ctx.db.patch(eventId, {
    status: newStatus,
    completedAt: Date.now(),
  });

  console.event("eventCompleted", {
    eventId,
    status: newStatus,
    totalWorkflows: eventWorkflows.length,
  });
}

/**
 * Replay an event - re-dispatch to all or specific handlers.
 */
export const replayEvent = mutation({
  args: {
    eventId: v.id("events"),
    workflowHandle: v.optional(v.string()),
  },
  returns: v.object({
    workflowIds: v.array(v.id("workflows")),
  }),
  handler: async (ctx, args) => {
    const console = await getDefaultLogger(ctx);

    const event = await ctx.db.get(args.eventId);
    assert(event, `Event not found: ${args.eventId}`);

    const topic = await ctx.db.get(event.topicId);
    assert(topic, `Topic not found: ${event.topicId}`);

    // Get handlers to replay to
    let registrations = await ctx.db
      .query("topicRegistrations")
      .withIndex("by_topic", (q) => q.eq("topicId", event.topicId))
      .collect();

    // Filter to specific handler if specified
    if (args.workflowHandle) {
      registrations = registrations.filter(
        (r) => r.workflowHandle === args.workflowHandle,
      );
      if (registrations.length === 0) {
        throw new Error(`Handler not found: ${args.workflowHandle}`);
      }
    }

    console.event("eventReplayed", {
      eventId: args.eventId,
      topicName: topic.name,
      handlerCount: registrations.length,
    });

    // Update event status
    await ctx.db.patch(args.eventId, {
      status: "dispatching",
      retryCount: event.retryCount + 1,
    });

    // Start workflows for each handler
    const workflowIds: Id<"workflows">[] = [];

    for (const registration of registrations) {
      try {
        const workflowName =
          registration.workflowName ??
          registration.workflowHandle.split(":").pop() ??
          "unknown";

        const workflowId = await ctx.runMutation(api.workflow.create, {
          workflowName,
          workflowHandle: registration.workflowHandle,
          workflowArgs: event.payload,
          startAsync: false,
        });

        await ctx.db.insert("eventWorkflows", {
          eventId: args.eventId,
          workflowId,
          workflowHandle: registration.workflowHandle,
          status: "running",
          createdAt: Date.now(),
        });

        workflowIds.push(workflowId);

        console.event("workflowDispatched", {
          eventId: args.eventId,
          workflowId,
          workflowHandle: registration.workflowHandle,
          isReplay: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `Failed to replay workflow ${registration.workflowHandle}:`,
          errorMessage,
        );
      }
    }

    return { workflowIds };
  },
});

/**
 * List pending or failed events for a topic.
 */
export const listPendingEvents = query({
  args: {
    topicId: v.optional(v.id("topics")),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    events: v.array(eventDocument),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    const tableQuery: QueryInitializer<DataModel["events"]> =
      ctx.db.query("events");
    let indexedQuery: Query<DataModel["events"]> = tableQuery;

    if (args.topicId) {
      indexedQuery = tableQuery
        .withIndex("by_topic_status", (q) => q.eq("topicId", args.topicId!))
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "failed"),
          ),
        );
    } else {
      indexedQuery = tableQuery
        .withIndex("by_status")
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "failed"),
          ),
        );
    }

    const events = await indexedQuery.take(limit);
    const count = events.length;

    return { events, count };
  },
});

/**
 * List events by topic with optional status filter.
 */
export const listEventsByTopic = query({
  args: {
    topicId: v.id("topics"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("dispatching"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    events: v.array(eventDocument),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    let query = ctx.db
      .query("events")
      .withIndex("by_topic_status", (q) => q.eq("topicId", args.topicId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const events = await query.take(limit);

    return { events };
  },
});

/**
 * Get detailed status for an event including all workflows.
 */
export const getEventStatus = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.object({
    event: eventDocument,
    workflows: v.array(eventWorkflowDocument),
  }),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    assert(event, `Event not found: ${args.eventId}`);

    const workflows = await ctx.db
      .query("eventWorkflows")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return { event, workflows };
  },
});

/**
 * Get topic by name.
 */
export const getTopicByName = query({
  args: {
    name: v.string(),
  },
  returns: v.union(topicDocument, v.null()),
  handler: async (ctx, args) => {
    const topic = await ctx.db
      .query("topics")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    return topic ?? null;
  },
});
