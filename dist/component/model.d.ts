import type { QueryCtx } from "./_generated/server.js";
export declare function getWorkflow(ctx: QueryCtx, workflowIdStr: string, expectedGenerationNumber: number | null): Promise<{
    _id: import("convex/values").GenericId<"workflows">;
    _creationTime: number;
    name?: string | undefined;
    onComplete?: {
        context?: any;
        fnHandle: string;
    } | undefined;
    logLevel?: null | undefined;
    startedAt?: null | undefined;
    state?: null | undefined;
    runResult?: {
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    } | undefined;
    generationNumber: number;
    workflowHandle: string;
    args: any;
}>;
export declare function getJournalEntry(ctx: QueryCtx, journalIdStr: string): Promise<{
    _id: import("convex/values").GenericId<"steps">;
    _creationTime: number;
    workflowId: import("convex/values").GenericId<"workflows">;
    stepNumber: number;
    step: {
        runResult?: {
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        } | undefined;
        workId?: import("@convex-dev/workpool").WorkId | undefined;
        completedAt?: number | undefined;
        type: "execution";
        name: string;
        args: any;
        startedAt: number;
        functionType: "query" | "mutation" | "action";
        handle: string;
        argsSize: number;
        inProgress: boolean;
    } | {
        runResult?: {
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        } | undefined;
        workId?: import("@convex-dev/workpool").WorkId | undefined;
        completedAt?: number | undefined;
        onPauseHandle?: string | undefined;
        type: "pause";
        name: string;
        args: any;
        startedAt: number;
        argsSize: number;
        inProgress: boolean;
    } | {
        runResult?: {
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        } | undefined;
        workId?: import("@convex-dev/workpool").WorkId | undefined;
        completedAt?: number | undefined;
        timeoutMs?: number | undefined;
        timeoutScheduledAt?: number | undefined;
        helperType?: "any" | "all" | "race" | undefined;
        groupId?: string | undefined;
        groupMembers?: import("convex/values").GenericId<"signals">[] | undefined;
        signalKeyMap?: any;
        winnerKey?: string | undefined;
        completedKeys?: string[] | undefined;
        minRequired?: number | undefined;
        type: "signal";
        signalId: import("convex/values").GenericId<"signals">;
        name: string;
        args: any;
        startedAt: number;
        argsSize: number;
        inProgress: boolean;
    };
}>;
//# sourceMappingURL=model.d.ts.map