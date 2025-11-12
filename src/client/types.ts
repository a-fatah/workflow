import type { RetryOption, WorkId } from "@convex-dev/workpool";
import type {
  Expand,
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
  RegisteredMutation,
} from "convex/server";
import type { api } from "../component/_generated/api.js";
import type {
  GenericId,
  ObjectType,
  PropertyValidators,
  Validator,
} from "convex/values";
import type { WorkflowId, SignalHandle } from "../types.js";
import type {
  SignalDocument,
  Event,
  EventWorkflow,
} from "../component/schema.js";

export type WorkflowComponent = UseApi<typeof api>;

export type RunOptions = {
  /**
   * The name of the function. By default, if you pass in api.foo.bar.baz,
   * it will use "foo/bar:baz" as the name. If you pass in a function handle,
   * it will use the function handle directly.
   */
  name?: string;
} & SchedulerOptions;

export type SchedulerOptions =
  | {
      /**
       * The time (ms since epoch) to run the action at.
       * If not provided, the action will be run as soon as possible.
       * Note: this is advisory only. It may run later.
       */
      runAt?: number;
    }
  | {
      /**
       * The number of milliseconds to run the action after.
       * If not provided, the action will be run as soon as possible.
       * Note: this is advisory only. It may run later.
       */
      runAfter?: number;
    };

export type SignalDefinition<T = any, M = any> =
  | Validator<T>
  | {
      returns: Validator<T, any, any>;
      metadata?: Validator<M, any, any>;
    };

export type SignalsDefinition = Record<string, SignalDefinition>;

export type ExtractReturns<SD extends SignalDefinition> =
  SD extends Validator<infer T>
    ? T
    : SD extends { returns: Validator<infer T, any, any> }
      ? T
      : never;

export type ExtractMetadata<SD extends SignalDefinition> = SD extends {
  metadata?: Validator<infer M, any, any>;
}
  ? M
  : any;

export interface WorkflowSignalHelpers<
  SignalsValidator extends SignalsDefinition = SignalsDefinition,
> {
  create<K extends keyof SignalsValidator>(
    name: K,
  ): Promise<
    SignalHandle<
      ExtractReturns<SignalsValidator[K]>,
      ExtractMetadata<SignalsValidator[K]>
    >
  >;
  create<Returns>(
    name: string,
    config: { returns: Validator<Returns, any, any> },
  ): Promise<SignalHandle<Returns>>;
  resolve: <Returns>(
    handle: SignalHandle<Returns>,
    value: Returns,
  ) => Promise<void>;
  reject: (handle: SignalHandle<unknown>, error: string) => Promise<void>;
  cancel: (handle: SignalHandle<unknown>, reason: string) => Promise<void>;
  load: (handle: SignalHandle<unknown>) => Promise<SignalDocument>;
  awaitSignal: <Returns>(
    handle: SignalHandle<Returns>,
    options?: { timeoutMs?: number },
  ) => Promise<Returns>;
  all: <Handles extends Record<string, SignalHandle<any>>>(
    handles: Handles,
  ) => Promise<{ [K in keyof Handles]: SignalValue<Handles[K]> }>;
  race: <Handles extends Record<string, SignalHandle<any>>>(
    handles: Handles,
    options?: SignalRaceOptions,
  ) => Promise<SignalRaceResult<Handles>>;
  any: <Handles extends Record<string, SignalHandle<any>>>(
    handles: Handles,
    options: SignalAnyOptions,
  ) => Promise<SignalAnyResult<Handles>>;
  updateMetadata: <Returns, Metadata>(
    handle: SignalHandle<Returns, Metadata>,
    metadata: Metadata,
  ) => Promise<void>;
}

export interface SignalCreateConfig<Returns> {
  name: string;
  returns: Validator<Returns, "required">;
  metadata?: unknown;
  validator?: unknown;
}

export type SignalValue<Handle extends SignalHandle<any>> =
  Handle extends SignalHandle<infer T> ? T : never;

export interface SignalRaceOptions {
  timeoutMs?: number;
}

export type SignalRaceResult<
  Handles extends Record<string, SignalHandle<any>>,
> = {
  winnerKey: keyof Handles;
  value: SignalValue<Handles[keyof Handles]>;
};

export interface SignalAnyOptions {
  min?: number;
  timeoutMs?: number;
}

export type SignalAnyResult<Handles extends Record<string, SignalHandle<any>>> =
  {
    resolved: Array<{
      key: keyof Handles;
      value: SignalValue<Handles[keyof Handles]>;
    }>;
  };
export type WorkflowStep<
  SignalsValidator extends SignalsDefinition = SignalsDefinition,
> = {
  /**
   * The ID of the workflow currently running.
   */
  workflowId: WorkflowId;
  signals: WorkflowSignalHelpers<SignalsValidator>;
  /**
   * Run a query with the given name and arguments.
   *
   * @param query - The query to run, like `internal.index.exampleQuery`.
   * @param args - The arguments to the query function.
   * @param opts - Options for scheduling and naming the query.
   */
  runQuery<Query extends FunctionReference<"query", "internal">>(
    query: Query,
    args: FunctionArgs<Query>,
    opts?: RunOptions,
  ): Promise<FunctionReturnType<Query>>;

  /**
   * Run a mutation with the given name and arguments.
   *
   * @param mutation - The mutation to run, like `internal.index.exampleMutation`.
   * @param args - The arguments to the mutation function.
   * @param opts - Options for scheduling and naming the mutation.
   */
  runMutation<Mutation extends FunctionReference<"mutation", "internal">>(
    mutation: Mutation,
    args: FunctionArgs<Mutation>,
    opts?: RunOptions,
  ): Promise<FunctionReturnType<Mutation>>;

  /**
   * Run an action with the given name and arguments.
   *
   * @param action - The action to run, like `internal.index.exampleAction`.
   * @param args - The arguments to the action function.
   * @param opts - Options for retrying, scheduling and naming the action.
   */
  runAction<Action extends FunctionReference<"action", "internal">>(
    action: Action,
    args: FunctionArgs<Action>,
    opts?: RunOptions & RetryOption,
  ): Promise<FunctionReturnType<Action>>;

  /**
   * Pause the workflow, to be resumed asynchronously.
   *
   * It will be marked as paused in the same transaction as the pause handler
   * is called. The pause handler must receive the arguments and return nothing.
   *
   * The return value is the value provided by the resume call, which must match
   * the return validator provided.
   *
   * @param pauseHandler - The pause handler to run, like `internal.index.examplePause`.
   * @param args - The arguments to the pause handler.
   * @param opts - Options for retrying, scheduling and naming the pause.
   */
  pause<
    Mutation extends FunctionReference<"mutation", "internal">,
    Returns = unknown,
  >(
    opts?: {
      /**
       * The name for the pause. By default, if you pass in api.foo.bar.baz,
       * it will use "foo/bar:baz" as the name. If you pass in a function handle,
       * it will use the function handle directly. Otherwise it will use "pause".
       */
      name?: string;
      returns: Validator<Returns, "required">;
    } & (
      | { onPause: Mutation; args: FunctionArgs<Mutation> }
      | { onPause?: undefined; args?: undefined }
    ),
  ): Promise<Returns>;
};

export type UseApi<API> = Expand<{
  [mod in keyof API]: API[mod] extends FunctionReference<
    infer FType,
    "public",
    infer FArgs,
    infer FReturnType,
    infer FComponentPath
  >
    ? FunctionReference<
        FType,
        "internal",
        OpaqueIds<FArgs>,
        OpaqueIds<FReturnType>,
        FComponentPath
      >
    : UseApi<API[mod]>;
}>;

export type OpaqueIds<T> =
  T extends GenericId<infer _T>
    ? string
    : T extends WorkId
      ? string
      : T extends (infer U)[]
        ? OpaqueIds<U>[]
        : T extends object
          ? { [K in keyof T]: OpaqueIds<T[K]> }
          : T;

// Event-driven workflows types

/**
 * Definition for an event that can be published.
 * The validator defines the shape of the event payload.
 */
export type EventDefinition<
  PayloadValidator extends PropertyValidators,
  Payload extends ObjectType<PayloadValidator> = ObjectType<PayloadValidator>,
> = {
  name: string;
  validator: PayloadValidator;
  _payload?: Payload; // Type inference helper
};

/**
 * A defined event that has been registered with the WorkflowManager.
 * Includes optional handlers that were declared at definition time.
 */
export type DefinedEvent<
  PayloadValidator extends PropertyValidators,
  Payload extends ObjectType<PayloadValidator> = ObjectType<PayloadValidator>,
> = {
  name: string;
  validator: PayloadValidator;
  _payload?: Payload;
  _topicId?: string; // Set internally after registration
  _handlers?: ReadonlyArray<FunctionReference<"mutation", "internal", Payload, any>>;
};

/**
 * Helper type to extract payload type from an event definition.
 */
export type EventPayload<E extends DefinedEvent<any>> =
  E extends DefinedEvent<infer V extends PropertyValidators>
    ? ObjectType<V>
    : never;

/**
 * Type constraint for event handlers.
 * Ensures that the handler's args match the event payload structure.
 */
export type EventHandler<E extends DefinedEvent<any>> =
  E extends DefinedEvent<infer PayloadValidator extends PropertyValidators>
    ? FunctionReference<"mutation", "internal", ObjectType<PayloadValidator>, any>
    : never;

/**
 * Options for publishing an event.
 */
export type PublishEventOptions = {
  /**
   * Idempotency key to prevent duplicate event processing.
   * If the same key is used, the existing event will be returned without creating workflows.
   */
  idempotencyKey?: string;

  /**
   * Optional metadata to store with the event (e.g., source, traceId, etc.)
   */
  metadata?: unknown;
};

/**
 * Result of publishing an event.
 */
export type PublishEventResult = {
  eventId: string;
  workflowIds: string[];
};

/**
 * Options for replaying an event.
 */
export type ReplayEventOptions = {
  /**
   * Optional: Only replay to a specific handler.
   * If not provided, replays to all registered handlers.
   */
  workflowHandle?: string;
};

/**
 * Result of replaying an event.
 */
export type ReplayEventResult = {
  workflowIds: string[];
};

/**
 * Event status details including all workflows.
 */
export type EventStatusResult = {
  event: OpaqueIds<Event>;
  workflows: OpaqueIds<EventWorkflow>[];
};
