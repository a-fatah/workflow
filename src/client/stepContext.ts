import { BaseChannel } from "async-channel";
import type {
  FunctionReference,
  FunctionArgs,
  FunctionReturnType,
  FunctionType,
  DefaultFunctionArgs,
  GenericMutationCtx,
  GenericDataModel,
} from "convex/server";
import type { Validator, PropertyValidators, Infer } from "convex/values";
import { convexToJson } from "convex/values";
import { safeFunctionName } from "./safeFunctionName.js";
import type { StepRequest, ExecutionStepRequest } from "./step.js";
import type { RetryOption } from "@convex-dev/workpool";
import type { RunOptions, WorkflowStep, WorkflowSignalHelpers, WorkflowComponent } from "./types.js";
import type { WorkflowId, SignalHandle } from "../types.js";

export class StepContext<SignalsValidator extends PropertyValidators = {}> implements WorkflowStep<SignalsValidator> {
  signals: WorkflowSignalHelpers<SignalsValidator>;

  constructor(
    public workflowId: WorkflowId,
    private sender: BaseChannel<StepRequest>,
    private component: WorkflowComponent,
    private ctx: GenericMutationCtx<GenericDataModel>,
    private generationNumber: number,
    private signalsSchema?: SignalsValidator,
  ) {
    this.signals = this.createSignalHelpers();
  }

  private createSignalHelpers(): WorkflowSignalHelpers<SignalsValidator> {
    return {
      create: (((nameOrConfig: any, config?: any) => {
        if (typeof nameOrConfig === "string" && config) {
          return this.createDynamicSignal(nameOrConfig, config);
        } else if (this.signalsSchema && typeof nameOrConfig === "string") {
          return this.createPreDeclaredSignal(nameOrConfig);
        }
        throw new Error("Invalid signal create arguments");
      }) as any),
      resolve: async (handle, value) => {
        await this.ctx.runMutation(this.component.signals.resolve, {
          signalId: handle.signalId,
          value,
        });
      },
      reject: async (handle, error) => {
        await this.ctx.runMutation(this.component.signals.reject, {
          signalId: handle.signalId,
          error,
        });
      },
      cancel: async (handle, reason) => {
        await this.ctx.runMutation(this.component.signals.cancel, {
          signalId: handle.signalId,
          reason,
        });
      },
      load: async (handle) => {
        return await this.ctx.runQuery(this.component.signals.load, {
          signalId: handle.signalId,
        }) as any;
      },
      awaitSignal: async (handle, options) => {
        return this.runSignalAwait(handle, options);
      },
      all: async (handles) => {
        return this.runSignalAll(handles);
      },
      race: async (handles, options) => {
        return this.runSignalRace(handles, options);
      },
      any: async (handles, options) => {
        return this.runSignalAny(handles, options);
      },
    };
  }

  private async createPreDeclaredSignal<K extends keyof SignalsValidator>(
    name: K
  ): Promise<SignalHandle<Infer<SignalsValidator[K]>>> {
    if (!this.signalsSchema || !(name in this.signalsSchema)) {
      throw new Error(`Signal "${String(name)}" not found in workflow signals schema`);
    }
    const validator = this.signalsSchema[name];
    // Convert validator to JSON-serializable format
    // Use JSON.parse(JSON.stringify()) to strip out undefined values and non-serializable properties
    const validatorJson = JSON.parse(JSON.stringify(validator));
    return await this.ctx.runMutation(this.component.signals.create, {
      workflowId: this.workflowId,
      generationNumber: this.generationNumber,
      name: String(name),
      validator: validatorJson,
    }) as SignalHandle<Infer<SignalsValidator[K]>>;
  }

  private async createDynamicSignal<T>(
    name: string,
    config: { returns: Validator<T, any, any> }
  ): Promise<SignalHandle<T>> {
    return await this.ctx.runMutation(this.component.signals.create, {
      workflowId: this.workflowId,
      generationNumber: this.generationNumber,
      name,
      validator: config.returns,
    }) as SignalHandle<T>;
  }

  private async runSignalAwait<T>(
    handle: SignalHandle<T>,
    options?: { timeoutMs?: number }
  ): Promise<T> {
    let send: unknown;
    const p = new Promise<T>((resolve, reject) => {
      send = this.sender.push({
        type: "signal" as const,
        name: handle.name,
        signalHandle: handle,
        args: { signalId: handle.signalId },
        timeoutMs: options?.timeoutMs,
        resolve: resolve as (result: unknown) => void,
        reject,
      });
    });
    void send;
    return p;
  }

  private async runSignalRace<Handles extends Record<string, SignalHandle<any>>>(
    handles: Handles,
    options?: { timeoutMs?: number }
  ): Promise<{ winnerKey: keyof Handles; value: any }> {
    let send: unknown;
    const p = new Promise<{ winnerKey: keyof Handles; value: any }>((resolve, reject) => {
      send = this.sender.push({
        type: "signalRace" as const,
        name: `race(${Object.keys(handles).join(",")})`,
        handles,
        args: { handles: Object.fromEntries(Object.entries(handles).map(([k, h]) => [k, h.signalId])) },
        timeoutMs: options?.timeoutMs,
        resolve: resolve as (result: unknown) => void,
        reject,
      });
    });
    void send;
    return p;
  }

  private async runSignalAll<Handles extends Record<string, SignalHandle<any>>>(
    handles: Handles
  ): Promise<{ [K in keyof Handles]: any }> {
    let send: unknown;
    const p = new Promise<{ [K in keyof Handles]: any }>((resolve, reject) => {
      send = this.sender.push({
        type: "signalAll" as const,
        name: `all(${Object.keys(handles).join(",")})`,
        handles,
        args: { handles: Object.fromEntries(Object.entries(handles).map(([k, h]) => [k, h.signalId])) },
        resolve: resolve as (result: unknown) => void,
        reject,
      });
    });
    void send;
    return p;
  }

  private async runSignalAny<Handles extends Record<string, SignalHandle<any>>>(
    handles: Handles,
    options: { min?: number; timeoutMs?: number }
  ): Promise<{ resolved: Array<{ key: keyof Handles; value: any }> }> {
    let send: unknown;
    const p = new Promise<{ resolved: Array<{ key: keyof Handles; value: any }> }>((resolve, reject) => {
      send = this.sender.push({
        type: "signalAny" as const,
        name: `any(${Object.keys(handles).join(",")})`,
        handles,
        args: { handles: Object.fromEntries(Object.entries(handles).map(([k, h]) => [k, h.signalId])), min: options.min },
        timeoutMs: options?.timeoutMs,
        min: options.min,
        resolve: resolve as (result: unknown) => void,
        reject,
      });
    });
    void send;
    return p;
  }

  runQuery<Query extends FunctionReference<"query", "internal">>(
    query: Query,
    args: FunctionArgs<Query>,
    opts?: RunOptions,
  ): Promise<FunctionReturnType<Query>> {
    return this.runFunction("query", query, args, opts);
  }

  runMutation<Mutation extends FunctionReference<"mutation", "internal">>(
    mutation: Mutation,
    args: FunctionArgs<Mutation>,
    opts?: RunOptions,
  ): Promise<FunctionReturnType<Mutation>> {
    return this.runFunction("mutation", mutation, args, opts);
  }

  runAction<Action extends FunctionReference<"action", "internal">>(
    action: Action,
    args: FunctionArgs<Action>,
    opts?: RunOptions & RetryOption,
  ): Promise<FunctionReturnType<Action>> {
    return this.runFunction("action", action, args, opts);
  }

  pause<
    Mutation extends FunctionReference<
      "mutation",
      "internal",
      DefaultFunctionArgs,
      void
    >,
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
  ): Promise<Returns> {
    return this.runPause(opts);
  }

  private runFunction<F extends FunctionReference<FunctionType, "internal">>(
    functionType: FunctionType,
    f: F,
    args: unknown,
    opts?: RunOptions & RetryOption,
  ): Promise<unknown> {
    const { name, retry, ...schedulerOptions } = opts ?? {};
    return this.runExecution({
      type: "execution",
      name: name ?? safeFunctionName(f),
      functionType,
      function: f,
      args: args ?? {},
      retry,
      schedulerOptions,
    });
  }

  private runPause<
    Mutation extends FunctionReference<
      "mutation",
      "internal",
      DefaultFunctionArgs,
      void
    >,
    Returns = unknown,
  >(
    opts?: {
      name?: string;
      returns: Validator<Returns, "required">;
    } & (
      | { onPause: Mutation; args: FunctionArgs<Mutation> }
      | { onPause?: undefined; args?: undefined }
    ),
  ): Promise<Returns> {
    let send: unknown;
    const p = new Promise<Returns>((resolve, reject) => {
      send = this.sender.push({
        type: "pause" as const,
        name: opts?.name ?? (opts?.onPause ? safeFunctionName(opts.onPause) : "pause"),
        onPauseFunction: opts?.onPause,
        args: opts?.args ?? {},
        schedulerOptions: {},
        resolve: resolve as (result: unknown) => void,
        reject,
      });
    });
    void send;
    return p;
  }

  private async runExecution(
    req: Omit<ExecutionStepRequest, "resolve" | "reject">,
  ): Promise<unknown> {
    let send: unknown;
    const p = new Promise<unknown>((resolve, reject) => {
      send = this.sender.push({
        ...req,
        resolve,
        reject,
      });
    });
    await send;
    return p;
  }
}
