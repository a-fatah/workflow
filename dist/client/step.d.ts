import type { RetryBehavior, RunResult, WorkpoolOptions } from "@convex-dev/workpool";
import { BaseChannel } from "async-channel";
import { type FunctionReference, type FunctionType, type GenericDataModel, type GenericMutationCtx } from "convex/server";
import { type JournalEntry } from "../component/schema.js";
import type { SchedulerOptions, WorkflowComponent } from "./types.js";
import type { SignalHandle } from "../types.js";
export type WorkerResult = {
    type: "handlerDone";
    runResult: RunResult;
} | {
    type: "executorBlocked";
};
export type ExecutionStepRequest = {
    type: "execution";
    name: string;
    functionType: FunctionType;
    function: FunctionReference<FunctionType, "internal">;
    args: unknown;
    retry: RetryBehavior | boolean | undefined;
    schedulerOptions: SchedulerOptions;
    resolve: (result: unknown) => void;
    reject: (error: unknown) => void;
};
export type PauseStepRequest = {
    type: "pause";
    name: string;
    onPauseFunction?: FunctionReference<"mutation", "internal">;
    args: unknown;
    schedulerOptions: SchedulerOptions;
    resolve: (result: unknown) => void;
    reject: (error: unknown) => void;
};
export type SignalAwaitRequest = {
    type: "signal";
    name: string;
    signalHandle: SignalHandle<unknown>;
    args: {
        signalId: string;
    };
    timeoutMs?: number;
    resolve: (result: unknown) => void;
    reject: (error: unknown) => void;
};
export type SignalAllRequest = {
    type: "signalAll";
    name: string;
    handles: Record<string, SignalHandle<unknown>>;
    args: {
        handles: Record<string, string>;
    };
    resolve: (result: unknown) => void;
    reject: (error: unknown) => void;
};
export type SignalRaceRequest = {
    type: "signalRace";
    name: string;
    handles: Record<string, SignalHandle<unknown>>;
    args: {
        handles: Record<string, string>;
    };
    timeoutMs?: number;
    resolve: (result: unknown) => void;
    reject: (error: unknown) => void;
};
export type SignalAnyRequest = {
    type: "signalAny";
    name: string;
    handles: Record<string, SignalHandle<unknown>>;
    args: {
        handles: Record<string, string>;
        min?: number;
    };
    timeoutMs?: number;
    min?: number;
    resolve: (result: unknown) => void;
    reject: (error: unknown) => void;
};
export type StepRequest = ExecutionStepRequest | PauseStepRequest | SignalAwaitRequest | SignalAllRequest | SignalRaceRequest | SignalAnyRequest;
export declare class StepExecutor {
    private workflowId;
    private generationNumber;
    private ctx;
    private component;
    private journalEntries;
    private receiver;
    private now;
    private workpoolOptions;
    private journalEntrySize;
    constructor(workflowId: string, generationNumber: number, ctx: GenericMutationCtx<GenericDataModel>, component: WorkflowComponent, journalEntries: Array<JournalEntry>, receiver: BaseChannel<StepRequest>, now: number, workpoolOptions: WorkpoolOptions | undefined);
    run(): Promise<WorkerResult>;
    getGenerationState(): {
        now: number;
        latest: boolean;
    };
    completeMessage(message: StepRequest, entry: JournalEntry): void;
    startSteps(messages: StepRequest[]): Promise<JournalEntry[]>;
}
//# sourceMappingURL=step.d.ts.map