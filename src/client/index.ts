import type {
  WorkpoolOptions,
  WorkpoolRetryOptions,
} from "@convex-dev/workpool";
import {
  createFunctionHandle,
  type FunctionArgs,
  type FunctionReference,
  type FunctionVisibility,
  type GenericDataModel,
  type GenericMutationCtx,
  type GenericQueryCtx,
  type RegisteredMutation,
  type ReturnValueForOptionalValidator,
} from "convex/server";
import type { ObjectType, PropertyValidators, Validator, Infer } from "convex/values";
import type { Step, SignalDocument } from "../component/schema.js";
import type { OnCompleteArgs, WorkflowId } from "../types.js";
import { safeFunctionName } from "./safeFunctionName.js";
import type {
  OpaqueIds,
  WorkflowComponent,
  WorkflowStep,
  SignalDefinition,
  ExtractReturns,
  ExtractMetadata,
  DefinedEvent,
  EventHandler,
  PublishEventOptions,
  PublishEventResult,
  ReplayEventOptions,
  ReplayEventResult,
  EventStatusResult,
} from "./types.js";
import { workflowMutation } from "./workflowMutation.js";
import { validate } from "convex-helpers/validators";

export { vWorkflowId, type WorkflowId } from "../types.js";
export type { RunOptions, SignalDefinition, DefinedEvent } from "./types.js";

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
  onComplete?: FunctionReference<
    "mutation",
    FunctionVisibility,
    OnCompleteArgs
  > | null;

  /**
   * A context object to pass to the `onComplete` mutation.
   * Useful for passing data from the enqueue site to the onComplete site.
   */
  context?: unknown;
};

export type WorkflowDefinition<
  ArgsValidator extends PropertyValidators,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReturnsValidator extends Validator<any, "required", any> | void = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator> = any,
  SignalsValidator extends Record<string, any> = Record<string, any>,
> = {
  args?: ArgsValidator;
  signals?: SignalsValidator;
  handler: (
    step: WorkflowStep<SignalsValidator>,
    args: ObjectType<ArgsValidator>,
  ) => Promise<ReturnValue>;
  returns?: ReturnsValidator;
  workpoolOptions?: WorkpoolRetryOptions;
};

export type DefinedWorkflow<
  ArgsValidator extends PropertyValidators,
  ReturnsValidator extends Validator<any, "required", any> | void,
  ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator>,
  SignalsValidator extends Record<string, any>,
> = {
  mutation: RegisteredMutation<"internal", ObjectType<ArgsValidator>, void>;
  _signals?: SignalsValidator;
  _args?: ArgsValidator;
  signals?: {
    [K in keyof SignalsValidator]: {
      resolve: (
        ctx: RunMutationCtx, 
        signalId: string, 
        value: SignalsValidator[K] extends SignalDefinition 
          ? ExtractReturns<SignalsValidator[K]> 
          : Infer<SignalsValidator[K]>
      ) => Promise<void>;
      reject: (ctx: RunMutationCtx, signalId: string, error: string) => Promise<void>;
      get: (ctx: RunQueryCtx, signalId: string) => Promise<OpaqueIds<SignalDocument> | null>;
      updateMetadata: (
        ctx: RunMutationCtx,
        signalId: string,
        metadata: SignalsValidator[K] extends SignalDefinition
          ? ExtractMetadata<SignalsValidator[K]>
          : any
      ) => Promise<void>;
    };
  };
};

export type WorkflowStatus =
  | { type: "inProgress"; running: OpaqueIds<Step>[] }
  | { type: "completed" }
  | { type: "canceled" }
  | { type: "failed"; error: string };

export class WorkflowManager {
  constructor(
    public component: WorkflowComponent,
    public options?: {
      workpoolOptions: WorkpoolOptions;
    },
  ) {}

  /**
   * Define a new workflow.
   *
   * @param workflow - The workflow definition.
   * @returns The defined workflow with mutation and type-safe signal resolvers.
   */
  define<
    ArgsValidator extends PropertyValidators,
    ReturnsValidator extends Validator<unknown, "required", string> | void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator> = any,
    SignalsValidator extends Record<string, any> = Record<string, any>,
  >(
    workflow: WorkflowDefinition<ArgsValidator, ReturnsValidator, ReturnValue, SignalsValidator>,
  ): DefinedWorkflow<ArgsValidator, ReturnsValidator, ReturnValue, SignalsValidator> {
    const mutation = workflowMutation(
      this.component,
      workflow,
      this.options?.workpoolOptions,
    );

    const signals = {} as any;
    if (workflow.signals) {
      for (const [signalName, signalDef] of Object.entries(workflow.signals)) {
        const validator = typeof signalDef === 'object' && signalDef !== null && 'returns' in signalDef 
          ? signalDef.returns 
          : signalDef;
        const metadataValidator = typeof signalDef === 'object' && signalDef !== null && 'metadata' in signalDef
          ? signalDef.metadata
          : undefined;

        signals[signalName] = {
          resolve: async (ctx: RunMutationCtx, signalId: string, value: unknown) => {
            if (validator) {
              validate(validator as any, value, { throw: true });
            }
            await ctx.runMutation(this.component.signals.resolve, {
              signalId,
              value,
            });
          },
          reject: async (ctx: RunMutationCtx, signalId: string, error: string) => {
            await ctx.runMutation(this.component.signals.reject, {
              signalId,
              error,
            });
          },
          get: async (ctx: RunQueryCtx, signalId: string) => {
            return await ctx.runQuery(this.component.signals.load, { signalId });
          },
          updateMetadata: async (ctx: RunMutationCtx, signalId: string, metadata: unknown) => {
            if (metadataValidator) {
              validate(metadataValidator as any, metadata, { throw: true });
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
  async start<
    ArgsValidator extends PropertyValidators,
    ReturnsValidator extends Validator<any, "required", any> | void,
    ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator>,
    SignalsValidator extends Record<string, any>,
  >(
    ctx: RunMutationCtx,
    workflow: FunctionReference<"mutation", "internal">,
    args: ObjectType<ArgsValidator>,
    options?: CallbackOptions & {
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
    },
  ): Promise<WorkflowId> {
    let mutationRef: FunctionReference<"mutation", "internal">;
    
    if (this.isDefinedWorkflow(workflow)) {
      mutationRef = workflow.mutation as any as FunctionReference<"mutation", "internal">;
    } else {
      mutationRef = workflow as FunctionReference<"mutation", "internal">;
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
    return workflowId as unknown as WorkflowId;
  }

  private isDefinedWorkflow(workflow: any): workflow is DefinedWorkflow<any, any, any, any> {
    return workflow && typeof workflow === 'object' && 'mutation' in workflow;
  }

  /**
   * Get a workflow's status.
   *
   * @param ctx - The Convex context.
   * @param workflowId - The workflow ID.
   * @returns The workflow status.
   */
  async status(
    ctx: RunQueryCtx,
    workflowId: WorkflowId,
  ): Promise<WorkflowStatus> {
    const { workflow, inProgress } = await ctx.runQuery(
      this.component.workflow.getStatus,
      { workflowId },
    );
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
  async cancel(ctx: RunMutationCtx, workflowId: WorkflowId) {
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
  async cleanup(ctx: RunMutationCtx, workflowId: WorkflowId): Promise<boolean> {
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
  async resume<
    ArgsValidator extends PropertyValidators,
    ReturnsValidator extends Validator<any, "required", any> | void,
    ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator>,
    SignalsValidator extends Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    V extends Validator<any, "optional", any>,
  >(
    ctx: RunMutationCtx,
    workflow: DefinedWorkflow<ArgsValidator, ReturnsValidator, ReturnValue, SignalsValidator>,
    workflowId: WorkflowId,
    resumeValue: unknown,
    opts?: {
      returns?: V;
      name?: string;
    },
  ): Promise<void> {
    const mutationRef = workflow.mutation as any as FunctionReference<"mutation", "internal">;
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
  defineEvent<PayloadValidator extends PropertyValidators>(
    config: {
      name: string;
      validator: PayloadValidator;
      handlers?: Array<EventHandler<DefinedEvent<PayloadValidator>>>;
    }
  ): DefinedEvent<PayloadValidator> {
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
      publish: async <PayloadValidator extends PropertyValidators>(
        ctx: RunMutationCtx,
        eventDef: DefinedEvent<PayloadValidator>,
        payload: ObjectType<PayloadValidator>,
        options?: PublishEventOptions
      ): Promise<PublishEventResult> => {
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
          (eventDef as any)._topicId = topicId;
        }

        // Publish the event
        const result = await ctx.runMutation(this.component.events.publishEvent, {
          topicId,
          payload,
          idempotencyKey: options?.idempotencyKey,
          metadata: options?.metadata,
        });

        return {
          eventId: result.eventId as unknown as string,
          workflowIds: result.workflowIds.map((id) => id as unknown as string),
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
      replay: async (
        ctx: RunMutationCtx,
        eventId: string,
        options?: ReplayEventOptions
      ): Promise<ReplayEventResult> => {
        const result = await ctx.runMutation(this.component.events.replayEvent, {
          eventId: eventId as any,
          workflowHandle: options?.workflowHandle,
        });

        return {
          workflowIds: result.workflowIds.map((id) => id as unknown as string),
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
      listPending: async (
        ctx: RunQueryCtx,
        topicName?: string,
        limit?: number
      ): Promise<any[]> => {
        let topicId: string | undefined;

        if (topicName) {
          const topic = await ctx.runQuery(this.component.events.getTopicByName, {
            name: topicName,
          });
          if (topic) {
            topicId = topic._id;
          }
        }

        const result = await ctx.runQuery(this.component.events.listPendingEvents, {
          topicId: topicId as any,
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
      getStatus: async (
        ctx: RunQueryCtx,
        eventId: string
      ): Promise<EventStatusResult> => {
        const result = await ctx.runQuery(this.component.events.getEventStatus, {
          eventId: eventId as any,
        });

        return result as any;
      },
    };
  }
}

type RunQueryCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};
type RunMutationCtx = {
  runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};
