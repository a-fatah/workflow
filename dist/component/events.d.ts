import type { Id } from "./_generated/dataModel.js";
/**
 * Define a topic for event publishing.
 * This is idempotent - calling it multiple times with the same name updates the validator.
 */
export declare const defineTopic: import("convex/server").RegisteredMutation<"public", {
    name: string;
    validator: any;
}, Promise<import("convex/values").GenericId<"topics">>>;
/**
 * Register a workflow handler for a topic.
 * This is idempotent - registering the same handler multiple times is safe.
 */
export declare const registerWorkflow: import("convex/server").RegisteredMutation<"public", {
    workflowName?: string | undefined;
    workflowHandle: string;
    topicId: import("convex/values").GenericId<"topics">;
}, Promise<null>>;
/**
 * Unregister a workflow handler from a topic.
 */
export declare const unregisterWorkflow: import("convex/server").RegisteredMutation<"public", {
    workflowHandle: string;
    topicId: import("convex/values").GenericId<"topics">;
}, Promise<boolean>>;
/**
 * Publish an event to a topic.
 * Validates payload, handles idempotency, and starts workflows for all registered handlers.
 */
export declare const publishEvent: import("convex/server").RegisteredMutation<"public", {
    idempotencyKey?: string | undefined;
    metadata?: any;
    topicId: import("convex/values").GenericId<"topics">;
    payload: any;
}, Promise<{
    eventId: import("convex/values").GenericId<"events">;
    workflowIds: import("convex/values").GenericId<"workflows">[];
}>>;
/**
 * Mark an event workflow as completed.
 * This is called automatically by the workflow's onComplete handler.
 */
export declare const markWorkflowCompleted: import("convex/server").RegisteredMutation<"internal", {
    workflowId: import("convex/values").GenericId<"workflows">;
    context: any;
    result: {
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    };
}, Promise<null>>;
/**
 * Replay an event - re-dispatch to all or specific handlers.
 */
export declare const replayEvent: import("convex/server").RegisteredMutation<"public", {
    workflowHandle?: string | undefined;
    eventId: import("convex/values").GenericId<"events">;
}, Promise<{
    workflowIds: Id<"workflows">[];
}>>;
/**
 * List pending or failed events for a topic.
 */
export declare const listPendingEvents: import("convex/server").RegisteredQuery<"public", {
    topicId?: import("convex/values").GenericId<"topics"> | undefined;
    limit?: number | undefined;
}, Promise<{
    events: {
        _id: import("convex/values").GenericId<"events">;
        _creationTime: number;
        completedAt?: number | undefined;
        lastError?: string | undefined;
        idempotencyKey?: string | undefined;
        metadata?: any;
        status: "failed" | "pending" | "dispatching" | "completed";
        createdAt: number;
        topicId: import("convex/values").GenericId<"topics">;
        payload: any;
        retryCount: number;
    }[];
    count: number;
}>>;
/**
 * List events by topic with optional status filter.
 */
export declare const listEventsByTopic: import("convex/server").RegisteredQuery<"public", {
    status?: "failed" | "pending" | "dispatching" | "completed" | undefined;
    limit?: number | undefined;
    topicId: import("convex/values").GenericId<"topics">;
}, Promise<{
    events: {
        _id: import("convex/values").GenericId<"events">;
        _creationTime: number;
        completedAt?: number | undefined;
        lastError?: string | undefined;
        idempotencyKey?: string | undefined;
        metadata?: any;
        status: "failed" | "pending" | "dispatching" | "completed";
        createdAt: number;
        topicId: import("convex/values").GenericId<"topics">;
        payload: any;
        retryCount: number;
    }[];
}>>;
/**
 * Get detailed status for an event including all workflows.
 */
export declare const getEventStatus: import("convex/server").RegisteredQuery<"public", {
    eventId: import("convex/values").GenericId<"events">;
}, Promise<{
    event: {
        _id: import("convex/values").GenericId<"events">;
        _creationTime: number;
        completedAt?: number | undefined;
        lastError?: string | undefined;
        idempotencyKey?: string | undefined;
        metadata?: any;
        status: "failed" | "pending" | "dispatching" | "completed";
        createdAt: number;
        topicId: import("convex/values").GenericId<"topics">;
        payload: any;
        retryCount: number;
    };
    workflows: {
        _id: import("convex/values").GenericId<"eventWorkflows">;
        _creationTime: number;
        completedAt?: number | undefined;
        workflowId: import("convex/values").GenericId<"workflows">;
        status: "failed" | "canceled" | "pending" | "completed" | "running";
        workflowHandle: string;
        createdAt: number;
        eventId: import("convex/values").GenericId<"events">;
    }[];
}>>;
/**
 * Get topic by name.
 */
export declare const getTopicByName: import("convex/server").RegisteredQuery<"public", {
    name: string;
}, Promise<{
    _id: import("convex/values").GenericId<"topics">;
    _creationTime: number;
    name: string;
    validator: any;
    createdAt: number;
} | null>>;
//# sourceMappingURL=events.d.ts.map