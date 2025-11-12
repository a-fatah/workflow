import { type WorkId } from "@convex-dev/workpool";
export declare const load: import("convex/server").RegisteredQuery<"public", {
    workflowId: import("convex/values").GenericId<"workflows">;
}, Promise<{
    journalEntries: {
        workflowId: import("convex/values").GenericId<"workflows">;
        _id: string;
        _creationTime: number;
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
            workId?: WorkId | undefined;
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
            workId?: WorkId | undefined;
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
            workId?: WorkId | undefined;
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
    ok: boolean;
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
    logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
}>>;
export declare const startSteps: import("convex/server").RegisteredMutation<"public", {
    workpoolOptions?: {
        logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR" | undefined;
        maxParallelism?: number | undefined;
        defaultRetryBehavior?: {
            maxAttempts: number;
            initialBackoffMs: number;
            base: number;
        } | undefined;
        retryActionsByDefault?: boolean | undefined;
    } | undefined;
    workflowId: string;
    generationNumber: number;
    steps: {
        retry?: boolean | {
            maxAttempts: number;
            initialBackoffMs: number;
            base: number;
        } | undefined;
        schedulerOptions?: {
            runAt?: number | undefined;
        } | {
            runAfter?: number | undefined;
        } | undefined;
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
            workId?: WorkId | undefined;
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
            workId?: WorkId | undefined;
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
            workId?: WorkId | undefined;
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
}, Promise<{
    workflowId: import("convex/values").GenericId<"workflows">;
    _id: string;
    _creationTime: number;
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
        workId?: WorkId | undefined;
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
        workId?: WorkId | undefined;
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
        workId?: WorkId | undefined;
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
}[]>>;
export declare const resume: import("convex/server").RegisteredMutation<"public", {
    name?: string | undefined;
    workflowId: import("convex/values").GenericId<"workflows">;
    workflowHandle: string;
    resumeValue: any;
}, Promise<void>>;
//# sourceMappingURL=journal.d.ts.map