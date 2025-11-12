import { BaseChannel } from "async-channel";
import type { FunctionReference, FunctionArgs, FunctionReturnType, DefaultFunctionArgs, GenericMutationCtx, GenericDataModel } from "convex/server";
import type { Validator } from "convex/values";
import type { StepRequest } from "./step.js";
import type { RetryOption } from "@convex-dev/workpool";
import type { RunOptions, WorkflowStep, WorkflowSignalHelpers, WorkflowComponent, SignalsDefinition } from "./types.js";
import type { WorkflowId } from "../types.js";
export declare class StepContext<SignalsValidator extends SignalsDefinition = SignalsDefinition> implements WorkflowStep<SignalsValidator> {
    workflowId: WorkflowId;
    private sender;
    private component;
    private ctx;
    private generationNumber;
    private signalsSchema?;
    signals: WorkflowSignalHelpers<SignalsValidator>;
    constructor(workflowId: WorkflowId, sender: BaseChannel<StepRequest>, component: WorkflowComponent, ctx: GenericMutationCtx<GenericDataModel>, generationNumber: number, signalsSchema?: SignalsValidator | undefined);
    private createSignalHelpers;
    private createPreDeclaredSignal;
    private createDynamicSignal;
    private runSignalAwait;
    private runSignalRace;
    private runSignalAll;
    private runSignalAny;
    runQuery<Query extends FunctionReference<"query", "internal">>(query: Query, args: FunctionArgs<Query>, opts?: RunOptions): Promise<FunctionReturnType<Query>>;
    runMutation<Mutation extends FunctionReference<"mutation", "internal">>(mutation: Mutation, args: FunctionArgs<Mutation>, opts?: RunOptions): Promise<FunctionReturnType<Mutation>>;
    runAction<Action extends FunctionReference<"action", "internal">>(action: Action, args: FunctionArgs<Action>, opts?: RunOptions & RetryOption): Promise<FunctionReturnType<Action>>;
    pause<Mutation extends FunctionReference<"mutation", "internal", DefaultFunctionArgs, void>, Returns = unknown>(opts?: {
        /**
         * The name for the pause. By default, if you pass in api.foo.bar.baz,
         * it will use "foo/bar:baz" as the name. If you pass in a function handle,
         * it will use the function handle directly. Otherwise it will use "pause".
         */
        name?: string;
        returns: Validator<Returns, "required">;
    } & ({
        onPause: Mutation;
        args: FunctionArgs<Mutation>;
    } | {
        onPause?: undefined;
        args?: undefined;
    })): Promise<Returns>;
    private runFunction;
    private runPause;
    private runExecution;
}
//# sourceMappingURL=stepContext.d.ts.map