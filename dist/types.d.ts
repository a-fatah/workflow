import type { RunResult } from "@convex-dev/workpool";
import { type VString } from "convex/values";
export type WorkflowId = string & {
    __isWorkflowId: true;
};
export declare const vWorkflowId: VString<WorkflowId>;
export type OnCompleteArgs = {
    /**
     * The ID of the work that completed.
     */
    workflowId: WorkflowId;
    /**
     * The context object passed when enqueuing the work.
     * Useful for passing data from the enqueue site to the onComplete site.
     */
    context: unknown;
    /**
     * The result of the run that completed.
     */
    result: RunResult;
};
export type SignalHandle<Returns = unknown, Metadata = any> = {
    signalId: string;
    workflowId: string;
    generationNumber: number;
    name: string;
    __returns?: Returns;
    __metadata?: Metadata;
};
export declare const vSignalHandle: import("convex/values").VObject<{
    signalId: string;
    workflowId: string;
    generationNumber: number;
    name: string;
}, {
    signalId: VString<string, "required">;
    workflowId: VString<string, "required">;
    generationNumber: import("convex/values").VFloat64<number, "required">;
    name: VString<string, "required">;
}, "required", "signalId" | "workflowId" | "generationNumber" | "name">;
//# sourceMappingURL=types.d.ts.map