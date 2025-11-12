import { type Infer } from "convex/values";
import { type MutationCtx } from "./_generated/server.js";
export declare const create: import("convex/server").RegisteredMutation<"public", {
    onComplete?: {
        context?: any;
        fnHandle: string;
    } | undefined;
    maxParallelism?: number | undefined;
    startAsync?: boolean | undefined;
    workflowHandle: string;
    workflowName: string;
    workflowArgs: any;
}, Promise<import("convex/values").GenericId<"workflows">>>;
export declare const getStatus: import("convex/server").RegisteredQuery<"public", {
    workflowId: import("convex/values").GenericId<"workflows">;
}, Promise<{
    workflow: {
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
    };
    inProgress: {
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
    }[];
    logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
}>>;
export declare const cancel: import("convex/server").RegisteredMutation<"public", {
    workflowId: import("convex/values").GenericId<"workflows">;
}, Promise<void>>;
declare const completeArgs: import("convex/values").VObject<{
    workflowId: import("convex/values").GenericId<"workflows">;
    generationNumber: number;
    runResult: {
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    };
}, {
    workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
    generationNumber: import("convex/values").VFloat64<number, "required">;
    runResult: import("convex/values").VUnion<{
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    }, [import("convex/values").VObject<{
        kind: "success";
        returnValue: any;
    }, {
        kind: import("convex/values").VLiteral<"success", "required">;
        returnValue: import("convex/values").VAny<any, "required", string>;
    }, "required", "kind" | "returnValue" | `returnValue.${string}`>, import("convex/values").VObject<{
        kind: "failed";
        error: string;
    }, {
        kind: import("convex/values").VLiteral<"failed", "required">;
        error: import("convex/values").VString<string, "required">;
    }, "required", "kind" | "error">, import("convex/values").VObject<{
        kind: "canceled";
    }, {
        kind: import("convex/values").VLiteral<"canceled", "required">;
    }, "required", "kind">], "required", "kind" | "returnValue" | `returnValue.${string}` | "error">;
}, "required", "workflowId" | "generationNumber" | "runResult" | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error">;
export declare const complete: import("convex/server").RegisteredMutation<"public", {
    workflowId: import("convex/values").GenericId<"workflows">;
    generationNumber: number;
    runResult: {
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    };
}, Promise<void>>;
export declare function completeHandler(ctx: MutationCtx, args: Infer<typeof completeArgs>): Promise<void>;
export declare const cleanup: import("convex/server").RegisteredMutation<"public", {
    workflowId: string;
}, Promise<boolean>>;
export {};
//# sourceMappingURL=workflow.d.ts.map