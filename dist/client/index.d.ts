import type { WorkpoolOptions, WorkpoolRetryOptions } from "@convex-dev/workpool";
import { type FunctionReference, type FunctionVisibility, type GenericDataModel, type GenericMutationCtx, type GenericQueryCtx, type RegisteredMutation, type ReturnValueForOptionalValidator } from "convex/server";
import type { ObjectType, PropertyValidators, Validator, Infer } from "convex/values";
import type { Step, SignalDocument } from "../component/schema.js";
import type { OnCompleteArgs, WorkflowId } from "../types.js";
import type { OpaqueIds, WorkflowComponent, WorkflowStep, SignalDefinition, ExtractReturns, ExtractMetadata, DefinedEvent, EventHandler, PublishEventOptions, PublishEventResult, ReplayEventOptions, ReplayEventResult, EventStatusResult } from "./types.js";
export { vWorkflowId, type WorkflowId } from "../types.js";
export type { RunOptions, SignalDefinition, DefinedEvent, WorkflowStep } from "./types.js";
export type CallbackOptions = {
    /**
     * A mutation to run after the function succeeds, fails, or is canceled.
     * The context type is for your use, feel free to provide a validator for it.
     * e.g.
     * ```ts
     * export const completion = internalMutation({
     *  args: {
     *    workId: workIdValidator,
     *    context: v.any(),
     *    result: resultValidator,
     *  },
     *  handler: async (ctx, args) => {
     *    console.log(args.result, "Got Context back -> ", args.context, Date.now() - args.context);
     *  },
     * });
     * ```
     */
    onComplete?: FunctionReference<"mutation", FunctionVisibility, OnCompleteArgs> | null;
    /**
     * A context object to pass to the `onComplete` mutation.
     * Useful for passing data from the enqueue site to the onComplete site.
     */
    context?: unknown;
};
export type WorkflowDefinition<ArgsValidator extends PropertyValidators, ReturnsValidator extends Validator<any, "required", any> | void = any, ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator> = any, SignalsValidator extends Record<string, any> = Record<string, any>> = {
    args?: ArgsValidator;
    signals?: SignalsValidator;
    handler: (step: WorkflowStep<SignalsValidator>, args: ObjectType<ArgsValidator>) => Promise<ReturnValue>;
    returns?: ReturnsValidator;
    workpoolOptions?: WorkpoolRetryOptions;
};
export type DefinedWorkflow<ArgsValidator extends PropertyValidators, ReturnsValidator extends Validator<any, "required", any> | void, ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator>, SignalsValidator extends Record<string, any>> = {
    mutation: RegisteredMutation<"internal", ObjectType<ArgsValidator>, void>;
    _signals?: SignalsValidator;
    _args?: ArgsValidator;
    signals?: {
        [K in keyof SignalsValidator]: {
            resolve: (ctx: RunMutationCtx, signalId: string, value: SignalsValidator[K] extends SignalDefinition ? ExtractReturns<SignalsValidator[K]> : Infer<SignalsValidator[K]>) => Promise<void>;
            reject: (ctx: RunMutationCtx, signalId: string, error: string) => Promise<void>;
            get: (ctx: RunQueryCtx, signalId: string) => Promise<OpaqueIds<SignalDocument> | null>;
            updateMetadata: (ctx: RunMutationCtx, signalId: string, metadata: SignalsValidator[K] extends SignalDefinition ? ExtractMetadata<SignalsValidator[K]> : any) => Promise<void>;
        };
    };
};
export type WorkflowStatus = {
    type: "inProgress";
    running: OpaqueIds<Step>[];
} | {
    type: "completed";
} | {
    type: "canceled";
} | {
    type: "failed";
    error: string;
};
export declare class WorkflowManager {
    component: WorkflowComponent;
    options?: {
        workpoolOptions: WorkpoolOptions;
    } | undefined;
    constructor(component: WorkflowComponent, options?: {
        workpoolOptions: WorkpoolOptions;
    } | undefined);
    /**
     * Define a new workflow.
     *
     * @param workflow - The workflow definition.
     * @returns The defined workflow with mutation and type-safe signal resolvers.
     */
    define<ArgsValidator extends PropertyValidators, ReturnsValidator extends Validator<unknown, "required", string> | void, ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator> = any, SignalsValidator extends Record<string, any> = Record<string, any>>(workflow: WorkflowDefinition<ArgsValidator, ReturnsValidator, ReturnValue, SignalsValidator>): DefinedWorkflow<ArgsValidator, ReturnsValidator, ReturnValue, SignalsValidator>;
    /**
     * Kick off a defined workflow.
     *
     * @param ctx - The Convex context.
     * @param workflow - A FunctionReference to an exported workflow mutation (recommended) or a DefinedWorkflow object from workflow.define().
     * @param args - The workflow arguments.
     * @returns The workflow ID.
     */
    start<ArgsValidator extends PropertyValidators, ReturnsValidator extends Validator<any, "required", any> | void, ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator>, SignalsValidator extends Record<string, any>>(ctx: RunMutationCtx, workflow: FunctionReference<"mutation", "internal">, args: ObjectType<ArgsValidator>, options?: CallbackOptions & {
        /**
         * By default, during creation the workflow will be initiated immediately.
         * The benefit is that you catch errors earlier (e.g. passing a bad
         * workflow reference or catch arg validation).
         *
         * With `startAsync` set to true, the workflow will be created but will
         * start asynchronously via the internal workpool.
         * You can use this to queue up a lot of work,
         * or make `start` return faster (you still get a workflowId back).
         * @default false
         */
        startAsync?: boolean;
        /** @deprecated Use `startAsync` instead. */
        validateAsync?: boolean;
    }): Promise<WorkflowId>;
    private isDefinedWorkflow;
    /**
     * Get a workflow's status.
     *
     * @param ctx - The Convex context.
     * @param workflowId - The workflow ID.
     * @returns The workflow status.
     */
    status(ctx: RunQueryCtx, workflowId: WorkflowId): Promise<WorkflowStatus>;
    /**
     * Cancel a running workflow.
     *
     * @param ctx - The Convex context.
     * @param workflowId - The workflow ID.
     */
    cancel(ctx: RunMutationCtx, workflowId: WorkflowId): Promise<void>;
    /**
     * Clean up a completed workflow's storage.
     *
     * @param ctx - The Convex context.
     * @param workflowId - The workflow ID.
     * @returns - Whether the workflow's state was cleaned up.
     */
    cleanup(ctx: RunMutationCtx, workflowId: WorkflowId): Promise<boolean>;
    /**
     * Resume a paused workflow with a type-safe value.
     *
     * @param ctx - The Convex context.
     * @param workflow - The defined workflow from workflow.define().
     * @param workflowId - The workflow ID.
     * @param resumeValue - The value to pass to the paused step.
     * @param opts - Options including the validator for type inference and optional step name.
     */
    resume<ArgsValidator extends PropertyValidators, ReturnsValidator extends Validator<any, "required", any> | void, ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator>, SignalsValidator extends Record<string, any>, V extends Validator<any, "optional", any>>(ctx: RunMutationCtx, workflow: DefinedWorkflow<ArgsValidator, ReturnsValidator, ReturnValue, SignalsValidator>, workflowId: WorkflowId, resumeValue: unknown, opts?: {
        returns?: V;
        name?: string;
    }): Promise<void>;
    /**
     * Define an event with optional declarative handler registration.
     * Handlers are type-checked at compile time to ensure args match payload structure.
     *
     * @param config - Event configuration including name, validator, and optional handlers
     * @returns A defined event that can be used for publishing
     */
    defineEvent<PayloadValidator extends PropertyValidators>(config: {
        name: string;
        validator: PayloadValidator;
        handlers?: Array<EventHandler<DefinedEvent<PayloadValidator>>>;
    }): DefinedEvent<PayloadValidator>;
    /**
     * Event-driven workflow APIs.
     * Access via workflow.events.publish(), workflow.events.replay(), etc.
     */
    get events(): {
        /**
         * Publish an event to trigger workflows for all registered handlers.
         *
         * @param ctx - The Convex context
         * @param eventDef - The defined event from defineEvent()
         * @param payload - The event payload (type-checked against event validator)
         * @param options - Optional idempotency key and metadata
         * @returns Event ID and workflow IDs that were started
         */
        publish: <PayloadValidator extends PropertyValidators>(ctx: RunMutationCtx, eventDef: DefinedEvent<PayloadValidator>, payload: ObjectType<PayloadValidator>, options?: PublishEventOptions) => Promise<PublishEventResult>;
        /**
         * Replay a pending or failed event.
         *
         * @param ctx - The Convex context
         * @param eventId - The event ID to replay
         * @param options - Optional: specify a specific handler to replay to
         * @returns Workflow IDs that were started
         */
        replay: (ctx: RunMutationCtx, eventId: string, options?: ReplayEventOptions) => Promise<ReplayEventResult>;
        /**
         * List pending or failed events for monitoring.
         *
         * @param ctx - The Convex context
         * @param topicName - Optional: filter by topic name
         * @param limit - Optional: limit number of results (default 100)
         * @returns Array of pending/failed events
         */
        listPending: (ctx: RunQueryCtx, topicName?: string, limit?: number) => Promise<any[]>;
        /**
         * Get detailed status for an event including all workflows.
         *
         * @param ctx - The Convex context
         * @param eventId - The event ID
         * @returns Event details and all associated workflows
         */
        getStatus: (ctx: RunQueryCtx, eventId: string) => Promise<EventStatusResult>;
    };
}
type RunQueryCtx = {
    runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};
type RunMutationCtx = {
    runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};
//# sourceMappingURL=index.d.ts.map