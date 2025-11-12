import { createFunctionHandle, } from "convex/server";
import { safeFunctionName } from "./safeFunctionName.js";
import { workflowMutation } from "./workflowMutation.js";
import { validate } from "convex-helpers/validators";
export { vWorkflowId } from "../types.js";
export class WorkflowManager {
    component;
    options;
    constructor(component, options) {
        this.component = component;
        this.options = options;
    }
    /**
     * Define a new workflow.
     *
     * @param workflow - The workflow definition.
     * @returns The defined workflow with mutation and type-safe signal resolvers.
     */
    define(workflow) {
        const mutation = workflowMutation(this.component, workflow, this.options?.workpoolOptions);
        const signals = {};
        if (workflow.signals) {
            for (const [signalName, signalDef] of Object.entries(workflow.signals)) {
                const validator = typeof signalDef === 'object' && signalDef !== null && 'returns' in signalDef
                    ? signalDef.returns
                    : signalDef;
                const metadataValidator = typeof signalDef === 'object' && signalDef !== null && 'metadata' in signalDef
                    ? signalDef.metadata
                    : undefined;
                signals[signalName] = {
                    resolve: async (ctx, signalId, value) => {
                        if (validator) {
                            validate(validator, value, { throw: true });
                        }
                        await ctx.runMutation(this.component.signals.resolve, {
                            signalId,
                            value,
                        });
                    },
                    reject: async (ctx, signalId, error) => {
                        await ctx.runMutation(this.component.signals.reject, {
                            signalId,
                            error,
                        });
                    },
                    get: async (ctx, signalId) => {
                        return await ctx.runQuery(this.component.signals.load, { signalId });
                    },
                    updateMetadata: async (ctx, signalId, metadata) => {
                        if (metadataValidator) {
                            validate(metadataValidator, metadata, { throw: true });
                        }
                        await ctx.runMutation(this.component.signals.updateMetadata, {
                            signalId,
                            metadata,
                        });
                    },
                };
            }
        }
        return {
            mutation,
            _signals: workflow.signals,
            _args: workflow.args,
            signals,
        };
    }
    /**
     * Kick off a defined workflow.
     *
     * @param ctx - The Convex context.
     * @param workflow - A FunctionReference to an exported workflow mutation (recommended) or a DefinedWorkflow object from workflow.define().
     * @param args - The workflow arguments.
     * @returns The workflow ID.
     */
    async start(ctx, workflow, args, options) {
        let mutationRef;
        if (this.isDefinedWorkflow(workflow)) {
            mutationRef = workflow.mutation;
        }
        else {
            mutationRef = workflow;
        }
        const handle = await createFunctionHandle(mutationRef);
        const onComplete = options?.onComplete
            ? {
                fnHandle: await createFunctionHandle(options.onComplete),
                context: options.context,
            }
            : undefined;
        const workflowId = await ctx.runMutation(this.component.workflow.create, {
            workflowName: safeFunctionName(mutationRef),
            workflowHandle: handle,
            workflowArgs: args,
            maxParallelism: this.options?.workpoolOptions?.maxParallelism,
            onComplete,
            startAsync: options?.startAsync ?? options?.validateAsync,
        });
        return workflowId;
    }
    isDefinedWorkflow(workflow) {
        return workflow && typeof workflow === 'object' && 'mutation' in workflow;
    }
    /**
     * Get a workflow's status.
     *
     * @param ctx - The Convex context.
     * @param workflowId - The workflow ID.
     * @returns The workflow status.
     */
    async status(ctx, workflowId) {
        const { workflow, inProgress } = await ctx.runQuery(this.component.workflow.getStatus, { workflowId });
        const running = inProgress.map((entry) => entry.step);
        switch (workflow.runResult?.kind) {
            case undefined:
                return { type: "inProgress", running };
            case "canceled":
                return { type: "canceled" };
            case "failed":
                return { type: "failed", error: workflow.runResult.error };
            case "success":
                return { type: "completed" };
        }
    }
    /**
     * Cancel a running workflow.
     *
     * @param ctx - The Convex context.
     * @param workflowId - The workflow ID.
     */
    async cancel(ctx, workflowId) {
        await ctx.runMutation(this.component.workflow.cancel, {
            workflowId,
        });
    }
    /**
     * Clean up a completed workflow's storage.
     *
     * @param ctx - The Convex context.
     * @param workflowId - The workflow ID.
     * @returns - Whether the workflow's state was cleaned up.
     */
    async cleanup(ctx, workflowId) {
        return await ctx.runMutation(this.component.workflow.cleanup, {
            workflowId,
        });
    }
    /**
     * Resume a paused workflow with a type-safe value.
     *
     * @param ctx - The Convex context.
     * @param workflow - The defined workflow from workflow.define().
     * @param workflowId - The workflow ID.
     * @param resumeValue - The value to pass to the paused step.
     * @param opts - Options including the validator for type inference and optional step name.
     */
    async resume(ctx, workflow, workflowId, resumeValue, opts) {
        const mutationRef = workflow.mutation;
        const handle = await createFunctionHandle(mutationRef);
        await ctx.runMutation(this.component.journal.resume, {
            workflowHandle: handle,
            workflowId,
            resumeValue,
            name: opts?.name,
        });
    }
    /**
     * Define an event with optional declarative handler registration.
     * Handlers are type-checked at compile time to ensure args match payload structure.
     *
     * @param config - Event configuration including name, validator, and optional handlers
     * @returns A defined event that can be used for publishing
     */
    defineEvent(config) {
        return {
            name: config.name,
            validator: config.validator,
            _handlers: config.handlers,
        };
    }
    /**
     * Event-driven workflow APIs.
     * Access via workflow.events.publish(), workflow.events.replay(), etc.
     */
    get events() {
        return {
            /**
             * Publish an event to trigger workflows for all registered handlers.
             *
             * @param ctx - The Convex context
             * @param eventDef - The defined event from defineEvent()
             * @param payload - The event payload (type-checked against event validator)
             * @param options - Optional idempotency key and metadata
             * @returns Event ID and workflow IDs that were started
             */
            publish: async (ctx, eventDef, payload, options) => {
                // First, ensure topic exists and get topicId
                let topicId = eventDef._topicId;
                if (!topicId) {
                    // Define topic if not already done
                    // Pass null for validator - validation happens client-side
                    const topicName = eventDef.name;
                    topicId = await ctx.runMutation(this.component.events.defineTopic, {
                        name: topicName,
                        validator: null,
                    });
                    // Register handlers if they were declared at definition time
                    if (eventDef._handlers && eventDef._handlers.length > 0) {
                        for (const handler of eventDef._handlers) {
                            const workflowHandle = await createFunctionHandle(handler);
                            const workflowName = safeFunctionName(handler);
                            await ctx.runMutation(this.component.events.registerWorkflow, {
                                topicId,
                                workflowHandle,
                                workflowName,
                            });
                        }
                    }
                    // Cache topicId for future publishes
                    eventDef._topicId = topicId;
                }
                // Publish the event
                const result = await ctx.runMutation(this.component.events.publishEvent, {
                    topicId,
                    payload,
                    idempotencyKey: options?.idempotencyKey,
                    metadata: options?.metadata,
                });
                return {
                    eventId: result.eventId,
                    workflowIds: result.workflowIds.map((id) => id),
                };
            },
            /**
             * Replay a pending or failed event.
             *
             * @param ctx - The Convex context
             * @param eventId - The event ID to replay
             * @param options - Optional: specify a specific handler to replay to
             * @returns Workflow IDs that were started
             */
            replay: async (ctx, eventId, options) => {
                const result = await ctx.runMutation(this.component.events.replayEvent, {
                    eventId: eventId,
                    workflowHandle: options?.workflowHandle,
                });
                return {
                    workflowIds: result.workflowIds.map((id) => id),
                };
            },
            /**
             * List pending or failed events for monitoring.
             *
             * @param ctx - The Convex context
             * @param topicName - Optional: filter by topic name
             * @param limit - Optional: limit number of results (default 100)
             * @returns Array of pending/failed events
             */
            listPending: async (ctx, topicName, limit) => {
                let topicId;
                if (topicName) {
                    const topic = await ctx.runQuery(this.component.events.getTopicByName, {
                        name: topicName,
                    });
                    if (topic) {
                        topicId = topic._id;
                    }
                }
                const result = await ctx.runQuery(this.component.events.listPendingEvents, {
                    topicId: topicId,
                    limit,
                });
                return result.events;
            },
            /**
             * Get detailed status for an event including all workflows.
             *
             * @param ctx - The Convex context
             * @param eventId - The event ID
             * @returns Event details and all associated workflows
             */
            getStatus: async (ctx, eventId) => {
                const result = await ctx.runQuery(this.component.events.getEventStatus, {
                    eventId: eventId,
                });
                return result;
            },
        };
    }
}
//# sourceMappingURL=index.js.map