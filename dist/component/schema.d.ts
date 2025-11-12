import { type RunResult } from "@convex-dev/workpool";
import { type Infer, type Value } from "convex/values";
export declare function valueSize(value: Value): number;
export declare function resultSize(result: RunResult): number;
export declare const vOnComplete: import("convex/values").VObject<{
    context?: any;
    fnHandle: string;
}, {
    fnHandle: import("convex/values").VString<string, "required">;
    context: import("convex/values").VAny<any, "optional", string>;
}, "required", "fnHandle" | "context" | `context.${string}`>;
export type OnComplete = Infer<typeof vOnComplete>;
export declare const workflowDocument: import("convex/values").VObject<{
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
    _id: string;
    _creationTime: number;
    workflowHandle: string;
    args: any;
}, {
    name: import("convex/values").VString<string | undefined, "optional">;
    workflowHandle: import("convex/values").VString<string, "required">;
    args: import("convex/values").VAny<any, "required", string>;
    onComplete: import("convex/values").VObject<{
        context?: any;
        fnHandle: string;
    } | undefined, {
        fnHandle: import("convex/values").VString<string, "required">;
        context: import("convex/values").VAny<any, "optional", string>;
    }, "optional", "fnHandle" | "context" | `context.${string}`>;
    logLevel: import("convex/values").Validator<null, "optional">;
    startedAt: import("convex/values").Validator<null, "optional">;
    state: import("convex/values").Validator<null, "optional">;
    runResult: import("convex/values").VUnion<{
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    } | undefined, [import("convex/values").VObject<{
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
    }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
    generationNumber: import("convex/values").VFloat64<number, "required">;
    _id: import("convex/values").VString<string, "required">;
    _creationTime: import("convex/values").VFloat64<number, "required">;
}, "required", "generationNumber" | "name" | "_id" | "_creationTime" | "workflowHandle" | "args" | "onComplete" | "logLevel" | "startedAt" | "state" | "runResult" | `args.${string}` | "onComplete.fnHandle" | "onComplete.context" | `onComplete.context.${string}` | `logLevel.${string}` | `startedAt.${string}` | `state.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error">;
export type Workflow = Infer<typeof workflowDocument>;
declare const executionStep: import("convex/values").VObject<{
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
}, {
    type: import("convex/values").VLiteral<"execution", "required">;
    functionType: import("convex/values").VUnion<"query" | "mutation" | "action", import("convex/values").VLiteral<"query" | "mutation" | "action", "required">[], "required", never>;
    handle: import("convex/values").VString<string, "required">;
    argsSize: import("convex/values").VFloat64<number, "required">;
    args: import("convex/values").VAny<any, "required", string>;
    name: import("convex/values").VString<string, "required">;
    inProgress: import("convex/values").VBoolean<boolean, "required">;
    workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
    runResult: import("convex/values").VUnion<{
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    } | undefined, [import("convex/values").VObject<{
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
    }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
    startedAt: import("convex/values").VFloat64<number, "required">;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
}, "required", "type" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "functionType" | "handle" | "argsSize" | "inProgress" | "workId" | "completedAt">;
declare const pauseStep: import("convex/values").VObject<{
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
}, {
    type: import("convex/values").VLiteral<"pause", "required">;
    onPauseHandle: import("convex/values").VString<string | undefined, "optional">;
    argsSize: import("convex/values").VFloat64<number, "required">;
    args: import("convex/values").VAny<any, "required", string>;
    name: import("convex/values").VString<string, "required">;
    inProgress: import("convex/values").VBoolean<boolean, "required">;
    workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
    runResult: import("convex/values").VUnion<{
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    } | undefined, [import("convex/values").VObject<{
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
    }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
    startedAt: import("convex/values").VFloat64<number, "required">;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
}, "required", "type" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "argsSize" | "inProgress" | "workId" | "completedAt" | "onPauseHandle">;
declare const signalStep: import("convex/values").VObject<{
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
}, {
    type: import("convex/values").VLiteral<"signal", "required">;
    signalId: import("convex/values").VId<import("convex/values").GenericId<"signals">, "required">;
    argsSize: import("convex/values").VFloat64<number, "required">;
    args: import("convex/values").VAny<any, "required", string>;
    timeoutMs: import("convex/values").VFloat64<number | undefined, "optional">;
    timeoutScheduledAt: import("convex/values").VFloat64<number | undefined, "optional">;
    helperType: import("convex/values").VUnion<"any" | "all" | "race" | undefined, [import("convex/values").VLiteral<"all", "required">, import("convex/values").VLiteral<"race", "required">, import("convex/values").VLiteral<"any", "required">], "optional", never>;
    groupId: import("convex/values").VString<string | undefined, "optional">;
    groupMembers: import("convex/values").VArray<import("convex/values").GenericId<"signals">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"signals">, "required">, "optional">;
    signalKeyMap: import("convex/values").VAny<any, "optional", string>;
    winnerKey: import("convex/values").VString<string | undefined, "optional">;
    completedKeys: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
    minRequired: import("convex/values").VFloat64<number | undefined, "optional">;
    name: import("convex/values").VString<string, "required">;
    inProgress: import("convex/values").VBoolean<boolean, "required">;
    workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
    runResult: import("convex/values").VUnion<{
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    } | undefined, [import("convex/values").VObject<{
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
    }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
    startedAt: import("convex/values").VFloat64<number, "required">;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
}, "required", "type" | "signalId" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "argsSize" | "inProgress" | "workId" | "completedAt" | "timeoutMs" | "timeoutScheduledAt" | "helperType" | "groupId" | "groupMembers" | "signalKeyMap" | "winnerKey" | "completedKeys" | "minRequired" | `signalKeyMap.${string}`>;
export declare const step: import("convex/values").VUnion<{
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
}, [import("convex/values").VObject<{
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
}, {
    type: import("convex/values").VLiteral<"execution", "required">;
    functionType: import("convex/values").VUnion<"query" | "mutation" | "action", import("convex/values").VLiteral<"query" | "mutation" | "action", "required">[], "required", never>;
    handle: import("convex/values").VString<string, "required">;
    argsSize: import("convex/values").VFloat64<number, "required">;
    args: import("convex/values").VAny<any, "required", string>;
    name: import("convex/values").VString<string, "required">;
    inProgress: import("convex/values").VBoolean<boolean, "required">;
    workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
    runResult: import("convex/values").VUnion<{
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    } | undefined, [import("convex/values").VObject<{
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
    }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
    startedAt: import("convex/values").VFloat64<number, "required">;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
}, "required", "type" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "functionType" | "handle" | "argsSize" | "inProgress" | "workId" | "completedAt">, import("convex/values").VObject<{
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
}, {
    type: import("convex/values").VLiteral<"pause", "required">;
    onPauseHandle: import("convex/values").VString<string | undefined, "optional">;
    argsSize: import("convex/values").VFloat64<number, "required">;
    args: import("convex/values").VAny<any, "required", string>;
    name: import("convex/values").VString<string, "required">;
    inProgress: import("convex/values").VBoolean<boolean, "required">;
    workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
    runResult: import("convex/values").VUnion<{
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    } | undefined, [import("convex/values").VObject<{
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
    }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
    startedAt: import("convex/values").VFloat64<number, "required">;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
}, "required", "type" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "argsSize" | "inProgress" | "workId" | "completedAt" | "onPauseHandle">, import("convex/values").VObject<{
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
}, {
    type: import("convex/values").VLiteral<"signal", "required">;
    signalId: import("convex/values").VId<import("convex/values").GenericId<"signals">, "required">;
    argsSize: import("convex/values").VFloat64<number, "required">;
    args: import("convex/values").VAny<any, "required", string>;
    timeoutMs: import("convex/values").VFloat64<number | undefined, "optional">;
    timeoutScheduledAt: import("convex/values").VFloat64<number | undefined, "optional">;
    helperType: import("convex/values").VUnion<"any" | "all" | "race" | undefined, [import("convex/values").VLiteral<"all", "required">, import("convex/values").VLiteral<"race", "required">, import("convex/values").VLiteral<"any", "required">], "optional", never>;
    groupId: import("convex/values").VString<string | undefined, "optional">;
    groupMembers: import("convex/values").VArray<import("convex/values").GenericId<"signals">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"signals">, "required">, "optional">;
    signalKeyMap: import("convex/values").VAny<any, "optional", string>;
    winnerKey: import("convex/values").VString<string | undefined, "optional">;
    completedKeys: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
    minRequired: import("convex/values").VFloat64<number | undefined, "optional">;
    name: import("convex/values").VString<string, "required">;
    inProgress: import("convex/values").VBoolean<boolean, "required">;
    workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
    runResult: import("convex/values").VUnion<{
        kind: "success";
        returnValue: any;
    } | {
        kind: "failed";
        error: string;
    } | {
        kind: "canceled";
    } | undefined, [import("convex/values").VObject<{
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
    }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
    startedAt: import("convex/values").VFloat64<number, "required">;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
}, "required", "type" | "signalId" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "argsSize" | "inProgress" | "workId" | "completedAt" | "timeoutMs" | "timeoutScheduledAt" | "helperType" | "groupId" | "groupMembers" | "signalKeyMap" | "winnerKey" | "completedKeys" | "minRequired" | `signalKeyMap.${string}`>], "required", "type" | "signalId" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "functionType" | "handle" | "argsSize" | "inProgress" | "workId" | "completedAt" | "onPauseHandle" | "timeoutMs" | "timeoutScheduledAt" | "helperType" | "groupId" | "groupMembers" | "signalKeyMap" | "winnerKey" | "completedKeys" | "minRequired" | `signalKeyMap.${string}`>;
export type Step = Infer<typeof step>;
export type ExecutionStep = Infer<typeof executionStep>;
export type PauseStep = Infer<typeof pauseStep>;
export type SignalStep = Infer<typeof signalStep>;
declare const signalState: import("convex/values").VUnion<"pending" | "fulfilled" | "rejected" | "cancelled", import("convex/values").VLiteral<"pending" | "fulfilled" | "rejected" | "cancelled", "required">[], "required", never>;
export type SignalState = Infer<typeof signalState>;
export declare const signalObject: {
    workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
    generationNumber: import("convex/values").VFloat64<number, "required">;
    name: import("convex/values").VString<string, "required">;
    state: import("convex/values").VUnion<"pending" | "fulfilled" | "rejected" | "cancelled", import("convex/values").VLiteral<"pending" | "fulfilled" | "rejected" | "cancelled", "required">[], "required", never>;
    value: import("convex/values").VAny<any, "optional", string>;
    error: import("convex/values").VString<string | undefined, "optional">;
    cancelReason: import("convex/values").VString<string | undefined, "optional">;
    validator: import("convex/values").VAny<any, "optional", string>;
    metadata: import("convex/values").VAny<any, "optional", string>;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    waitingStepId: import("convex/values").VId<import("convex/values").GenericId<"steps"> | undefined, "optional">;
    helperType: import("convex/values").VUnion<"any" | "all" | "race" | undefined, [import("convex/values").VLiteral<"all", "required">, import("convex/values").VLiteral<"race", "required">, import("convex/values").VLiteral<"any", "required">], "optional", never>;
    groupId: import("convex/values").VString<string | undefined, "optional">;
    helperKey: import("convex/values").VString<string | undefined, "optional">;
};
export declare const topicDocument: import("convex/values").VObject<{
    name: string;
    _id: string;
    _creationTime: number;
    validator: any;
    createdAt: number;
}, {
    name: import("convex/values").VString<string, "required">;
    validator: import("convex/values").VAny<any, "required", string>;
    createdAt: import("convex/values").VFloat64<number, "required">;
    _id: import("convex/values").VString<string, "required">;
    _creationTime: import("convex/values").VFloat64<number, "required">;
}, "required", "name" | "_id" | "_creationTime" | "validator" | "createdAt" | `validator.${string}`>;
export type Topic = Infer<typeof topicDocument>;
export declare const topicRegistrationDocument: import("convex/values").VObject<{
    workflowName?: string | undefined;
    _id: string;
    _creationTime: number;
    workflowHandle: string;
    createdAt: number;
    topicId: import("convex/values").GenericId<"topics">;
}, {
    topicId: import("convex/values").VId<import("convex/values").GenericId<"topics">, "required">;
    workflowHandle: import("convex/values").VString<string, "required">;
    workflowName: import("convex/values").VString<string | undefined, "optional">;
    createdAt: import("convex/values").VFloat64<number, "required">;
    _id: import("convex/values").VString<string, "required">;
    _creationTime: import("convex/values").VFloat64<number, "required">;
}, "required", "_id" | "_creationTime" | "workflowHandle" | "createdAt" | "topicId" | "workflowName">;
export type TopicRegistration = Infer<typeof topicRegistrationDocument>;
declare const eventStatus: import("convex/values").VUnion<"failed" | "pending" | "dispatching" | "completed", import("convex/values").VLiteral<"failed" | "pending" | "dispatching" | "completed", "required">[], "required", never>;
export type EventStatus = Infer<typeof eventStatus>;
export declare const eventDocument: import("convex/values").VObject<{
    completedAt?: number | undefined;
    lastError?: string | undefined;
    idempotencyKey?: string | undefined;
    metadata?: any;
    status: "failed" | "pending" | "dispatching" | "completed";
    _id: string;
    _creationTime: number;
    createdAt: number;
    topicId: import("convex/values").GenericId<"topics">;
    payload: any;
    retryCount: number;
}, {
    topicId: import("convex/values").VId<import("convex/values").GenericId<"topics">, "required">;
    payload: import("convex/values").VAny<any, "required", string>;
    status: import("convex/values").VUnion<"failed" | "pending" | "dispatching" | "completed", import("convex/values").VLiteral<"failed" | "pending" | "dispatching" | "completed", "required">[], "required", never>;
    retryCount: import("convex/values").VFloat64<number, "required">;
    lastError: import("convex/values").VString<string | undefined, "optional">;
    idempotencyKey: import("convex/values").VString<string | undefined, "optional">;
    metadata: import("convex/values").VAny<any, "optional", string>;
    createdAt: import("convex/values").VFloat64<number, "required">;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    _id: import("convex/values").VString<string, "required">;
    _creationTime: import("convex/values").VFloat64<number, "required">;
}, "required", "status" | "_id" | "_creationTime" | "completedAt" | "createdAt" | "topicId" | "payload" | "retryCount" | "lastError" | "idempotencyKey" | "metadata" | `payload.${string}` | `metadata.${string}`>;
export type Event = Infer<typeof eventDocument>;
declare const eventWorkflowStatus: import("convex/values").VUnion<"failed" | "canceled" | "pending" | "completed" | "running", import("convex/values").VLiteral<"failed" | "canceled" | "pending" | "completed" | "running", "required">[], "required", never>;
export type EventWorkflowStatus = Infer<typeof eventWorkflowStatus>;
export declare const eventWorkflowDocument: import("convex/values").VObject<{
    completedAt?: number | undefined;
    workflowId: import("convex/values").GenericId<"workflows">;
    status: "failed" | "canceled" | "pending" | "completed" | "running";
    _id: string;
    _creationTime: number;
    workflowHandle: string;
    createdAt: number;
    eventId: import("convex/values").GenericId<"events">;
}, {
    eventId: import("convex/values").VId<import("convex/values").GenericId<"events">, "required">;
    workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
    workflowHandle: import("convex/values").VString<string, "required">;
    status: import("convex/values").VUnion<"failed" | "canceled" | "pending" | "completed" | "running", import("convex/values").VLiteral<"failed" | "canceled" | "pending" | "completed" | "running", "required">[], "required", never>;
    createdAt: import("convex/values").VFloat64<number, "required">;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    _id: import("convex/values").VString<string, "required">;
    _creationTime: import("convex/values").VFloat64<number, "required">;
}, "required", "workflowId" | "status" | "_id" | "_creationTime" | "workflowHandle" | "completedAt" | "createdAt" | "eventId">;
export type EventWorkflow = Infer<typeof eventWorkflowDocument>;
export declare const signalDocument: import("convex/values").VObject<{
    error?: string | undefined;
    completedAt?: number | undefined;
    helperType?: "any" | "all" | "race" | undefined;
    groupId?: string | undefined;
    validator?: any;
    metadata?: any;
    value?: any;
    cancelReason?: string | undefined;
    waitingStepId?: import("convex/values").GenericId<"steps"> | undefined;
    helperKey?: string | undefined;
    workflowId: import("convex/values").GenericId<"workflows">;
    generationNumber: number;
    name: string;
    _id: string;
    _creationTime: number;
    state: "pending" | "fulfilled" | "rejected" | "cancelled";
}, {
    workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
    generationNumber: import("convex/values").VFloat64<number, "required">;
    name: import("convex/values").VString<string, "required">;
    state: import("convex/values").VUnion<"pending" | "fulfilled" | "rejected" | "cancelled", import("convex/values").VLiteral<"pending" | "fulfilled" | "rejected" | "cancelled", "required">[], "required", never>;
    value: import("convex/values").VAny<any, "optional", string>;
    error: import("convex/values").VString<string | undefined, "optional">;
    cancelReason: import("convex/values").VString<string | undefined, "optional">;
    validator: import("convex/values").VAny<any, "optional", string>;
    metadata: import("convex/values").VAny<any, "optional", string>;
    completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    waitingStepId: import("convex/values").VId<import("convex/values").GenericId<"steps"> | undefined, "optional">;
    helperType: import("convex/values").VUnion<"any" | "all" | "race" | undefined, [import("convex/values").VLiteral<"all", "required">, import("convex/values").VLiteral<"race", "required">, import("convex/values").VLiteral<"any", "required">], "optional", never>;
    groupId: import("convex/values").VString<string | undefined, "optional">;
    helperKey: import("convex/values").VString<string | undefined, "optional">;
    _id: import("convex/values").VString<string, "required">;
    _creationTime: import("convex/values").VFloat64<number, "required">;
}, "required", "error" | "workflowId" | "generationNumber" | "name" | "_id" | "_creationTime" | "state" | "completedAt" | "helperType" | "groupId" | "validator" | `validator.${string}` | "metadata" | `metadata.${string}` | "value" | "cancelReason" | "waitingStepId" | "helperKey" | `value.${string}`>;
export type SignalDocument = Infer<typeof signalDocument>;
export declare function journalEntrySize(entry: JournalEntry): number;
export declare const journalDocument: import("convex/values").VObject<{
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
}, {
    workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
    stepNumber: import("convex/values").VFloat64<number, "required">;
    step: import("convex/values").VUnion<{
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
    }, [import("convex/values").VObject<{
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
    }, {
        type: import("convex/values").VLiteral<"execution", "required">;
        functionType: import("convex/values").VUnion<"query" | "mutation" | "action", import("convex/values").VLiteral<"query" | "mutation" | "action", "required">[], "required", never>;
        handle: import("convex/values").VString<string, "required">;
        argsSize: import("convex/values").VFloat64<number, "required">;
        args: import("convex/values").VAny<any, "required", string>;
        name: import("convex/values").VString<string, "required">;
        inProgress: import("convex/values").VBoolean<boolean, "required">;
        workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
        runResult: import("convex/values").VUnion<{
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        } | undefined, [import("convex/values").VObject<{
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
        }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
        startedAt: import("convex/values").VFloat64<number, "required">;
        completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    }, "required", "type" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "functionType" | "handle" | "argsSize" | "inProgress" | "workId" | "completedAt">, import("convex/values").VObject<{
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
    }, {
        type: import("convex/values").VLiteral<"pause", "required">;
        onPauseHandle: import("convex/values").VString<string | undefined, "optional">;
        argsSize: import("convex/values").VFloat64<number, "required">;
        args: import("convex/values").VAny<any, "required", string>;
        name: import("convex/values").VString<string, "required">;
        inProgress: import("convex/values").VBoolean<boolean, "required">;
        workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
        runResult: import("convex/values").VUnion<{
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        } | undefined, [import("convex/values").VObject<{
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
        }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
        startedAt: import("convex/values").VFloat64<number, "required">;
        completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    }, "required", "type" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "argsSize" | "inProgress" | "workId" | "completedAt" | "onPauseHandle">, import("convex/values").VObject<{
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
    }, {
        type: import("convex/values").VLiteral<"signal", "required">;
        signalId: import("convex/values").VId<import("convex/values").GenericId<"signals">, "required">;
        argsSize: import("convex/values").VFloat64<number, "required">;
        args: import("convex/values").VAny<any, "required", string>;
        timeoutMs: import("convex/values").VFloat64<number | undefined, "optional">;
        timeoutScheduledAt: import("convex/values").VFloat64<number | undefined, "optional">;
        helperType: import("convex/values").VUnion<"any" | "all" | "race" | undefined, [import("convex/values").VLiteral<"all", "required">, import("convex/values").VLiteral<"race", "required">, import("convex/values").VLiteral<"any", "required">], "optional", never>;
        groupId: import("convex/values").VString<string | undefined, "optional">;
        groupMembers: import("convex/values").VArray<import("convex/values").GenericId<"signals">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"signals">, "required">, "optional">;
        signalKeyMap: import("convex/values").VAny<any, "optional", string>;
        winnerKey: import("convex/values").VString<string | undefined, "optional">;
        completedKeys: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
        minRequired: import("convex/values").VFloat64<number | undefined, "optional">;
        name: import("convex/values").VString<string, "required">;
        inProgress: import("convex/values").VBoolean<boolean, "required">;
        workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
        runResult: import("convex/values").VUnion<{
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        } | undefined, [import("convex/values").VObject<{
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
        }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
        startedAt: import("convex/values").VFloat64<number, "required">;
        completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    }, "required", "type" | "signalId" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "argsSize" | "inProgress" | "workId" | "completedAt" | "timeoutMs" | "timeoutScheduledAt" | "helperType" | "groupId" | "groupMembers" | "signalKeyMap" | "winnerKey" | "completedKeys" | "minRequired" | `signalKeyMap.${string}`>], "required", "type" | "signalId" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "functionType" | "handle" | "argsSize" | "inProgress" | "workId" | "completedAt" | "onPauseHandle" | "timeoutMs" | "timeoutScheduledAt" | "helperType" | "groupId" | "groupMembers" | "signalKeyMap" | "winnerKey" | "completedKeys" | "minRequired" | `signalKeyMap.${string}`>;
    _id: import("convex/values").VString<string, "required">;
    _creationTime: import("convex/values").VFloat64<number, "required">;
}, "required", "workflowId" | "_id" | "_creationTime" | "stepNumber" | "step" | "step.type" | "step.signalId" | "step.name" | "step.args" | "step.startedAt" | "step.runResult" | `step.args.${string}` | "step.runResult.kind" | "step.runResult.returnValue" | `step.runResult.returnValue.${string}` | "step.runResult.error" | "step.functionType" | "step.handle" | "step.argsSize" | "step.inProgress" | "step.workId" | "step.completedAt" | "step.onPauseHandle" | "step.timeoutMs" | "step.timeoutScheduledAt" | "step.helperType" | "step.groupId" | "step.groupMembers" | "step.signalKeyMap" | "step.winnerKey" | "step.completedKeys" | "step.minRequired" | `step.signalKeyMap.${string}`>;
export type JournalEntry = Infer<typeof journalDocument>;
declare const _default: import("convex/server").SchemaDefinition<{
    config: import("convex/server").TableDefinition<import("convex/values").VObject<{
        logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR" | undefined;
        maxParallelism?: number | undefined;
    }, {
        logLevel: import("convex/values").VUnion<"DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR" | undefined, [import("convex/values").VLiteral<"DEBUG", "required">, import("convex/values").VLiteral<"TRACE", "required">, import("convex/values").VLiteral<"INFO", "required">, import("convex/values").VLiteral<"REPORT", "required">, import("convex/values").VLiteral<"WARN", "required">, import("convex/values").VLiteral<"ERROR", "required">], "optional", never>;
        maxParallelism: import("convex/values").VFloat64<number | undefined, "optional">;
    }, "required", "logLevel" | "maxParallelism">, {}, {}, {}>;
    workflows: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        name: import("convex/values").VString<string | undefined, "optional">;
        workflowHandle: import("convex/values").VString<string, "required">;
        args: import("convex/values").VAny<any, "required", string>;
        onComplete: import("convex/values").VObject<{
            context?: any;
            fnHandle: string;
        } | undefined, {
            fnHandle: import("convex/values").VString<string, "required">;
            context: import("convex/values").VAny<any, "optional", string>;
        }, "optional", "fnHandle" | "context" | `context.${string}`>;
        logLevel: import("convex/values").Validator<null, "optional">;
        startedAt: import("convex/values").Validator<null, "optional">;
        state: import("convex/values").Validator<null, "optional">;
        runResult: import("convex/values").VUnion<{
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        } | undefined, [import("convex/values").VObject<{
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
        }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
        generationNumber: import("convex/values").VFloat64<number, "required">;
    }, "required", "generationNumber" | "name" | "workflowHandle" | "args" | "onComplete" | "logLevel" | "startedAt" | "state" | "runResult" | `args.${string}` | "onComplete.fnHandle" | "onComplete.context" | `onComplete.context.${string}` | `logLevel.${string}` | `startedAt.${string}` | `state.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error">, {}, {}, {}>;
    steps: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
        stepNumber: import("convex/values").VFloat64<number, "required">;
        step: import("convex/values").VUnion<{
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
        }, [import("convex/values").VObject<{
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
        }, {
            type: import("convex/values").VLiteral<"execution", "required">;
            functionType: import("convex/values").VUnion<"query" | "mutation" | "action", import("convex/values").VLiteral<"query" | "mutation" | "action", "required">[], "required", never>;
            handle: import("convex/values").VString<string, "required">;
            argsSize: import("convex/values").VFloat64<number, "required">;
            args: import("convex/values").VAny<any, "required", string>;
            name: import("convex/values").VString<string, "required">;
            inProgress: import("convex/values").VBoolean<boolean, "required">;
            workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
            runResult: import("convex/values").VUnion<{
                kind: "success";
                returnValue: any;
            } | {
                kind: "failed";
                error: string;
            } | {
                kind: "canceled";
            } | undefined, [import("convex/values").VObject<{
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
            }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
            startedAt: import("convex/values").VFloat64<number, "required">;
            completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
        }, "required", "type" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "functionType" | "handle" | "argsSize" | "inProgress" | "workId" | "completedAt">, import("convex/values").VObject<{
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
        }, {
            type: import("convex/values").VLiteral<"pause", "required">;
            onPauseHandle: import("convex/values").VString<string | undefined, "optional">;
            argsSize: import("convex/values").VFloat64<number, "required">;
            args: import("convex/values").VAny<any, "required", string>;
            name: import("convex/values").VString<string, "required">;
            inProgress: import("convex/values").VBoolean<boolean, "required">;
            workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
            runResult: import("convex/values").VUnion<{
                kind: "success";
                returnValue: any;
            } | {
                kind: "failed";
                error: string;
            } | {
                kind: "canceled";
            } | undefined, [import("convex/values").VObject<{
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
            }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
            startedAt: import("convex/values").VFloat64<number, "required">;
            completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
        }, "required", "type" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "argsSize" | "inProgress" | "workId" | "completedAt" | "onPauseHandle">, import("convex/values").VObject<{
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
        }, {
            type: import("convex/values").VLiteral<"signal", "required">;
            signalId: import("convex/values").VId<import("convex/values").GenericId<"signals">, "required">;
            argsSize: import("convex/values").VFloat64<number, "required">;
            args: import("convex/values").VAny<any, "required", string>;
            timeoutMs: import("convex/values").VFloat64<number | undefined, "optional">;
            timeoutScheduledAt: import("convex/values").VFloat64<number | undefined, "optional">;
            helperType: import("convex/values").VUnion<"any" | "all" | "race" | undefined, [import("convex/values").VLiteral<"all", "required">, import("convex/values").VLiteral<"race", "required">, import("convex/values").VLiteral<"any", "required">], "optional", never>;
            groupId: import("convex/values").VString<string | undefined, "optional">;
            groupMembers: import("convex/values").VArray<import("convex/values").GenericId<"signals">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"signals">, "required">, "optional">;
            signalKeyMap: import("convex/values").VAny<any, "optional", string>;
            winnerKey: import("convex/values").VString<string | undefined, "optional">;
            completedKeys: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
            minRequired: import("convex/values").VFloat64<number | undefined, "optional">;
            name: import("convex/values").VString<string, "required">;
            inProgress: import("convex/values").VBoolean<boolean, "required">;
            workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId | undefined, "optional">;
            runResult: import("convex/values").VUnion<{
                kind: "success";
                returnValue: any;
            } | {
                kind: "failed";
                error: string;
            } | {
                kind: "canceled";
            } | undefined, [import("convex/values").VObject<{
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
            }, "required", "kind">], "optional", "kind" | "returnValue" | `returnValue.${string}` | "error">;
            startedAt: import("convex/values").VFloat64<number, "required">;
            completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
        }, "required", "type" | "signalId" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "argsSize" | "inProgress" | "workId" | "completedAt" | "timeoutMs" | "timeoutScheduledAt" | "helperType" | "groupId" | "groupMembers" | "signalKeyMap" | "winnerKey" | "completedKeys" | "minRequired" | `signalKeyMap.${string}`>], "required", "type" | "signalId" | "name" | "args" | "startedAt" | "runResult" | `args.${string}` | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "functionType" | "handle" | "argsSize" | "inProgress" | "workId" | "completedAt" | "onPauseHandle" | "timeoutMs" | "timeoutScheduledAt" | "helperType" | "groupId" | "groupMembers" | "signalKeyMap" | "winnerKey" | "completedKeys" | "minRequired" | `signalKeyMap.${string}`>;
    }, "required", "workflowId" | "stepNumber" | "step" | "step.type" | "step.signalId" | "step.name" | "step.args" | "step.startedAt" | "step.runResult" | `step.args.${string}` | "step.runResult.kind" | "step.runResult.returnValue" | `step.runResult.returnValue.${string}` | "step.runResult.error" | "step.functionType" | "step.handle" | "step.argsSize" | "step.inProgress" | "step.workId" | "step.completedAt" | "step.onPauseHandle" | "step.timeoutMs" | "step.timeoutScheduledAt" | "step.helperType" | "step.groupId" | "step.groupMembers" | "step.signalKeyMap" | "step.winnerKey" | "step.completedKeys" | "step.minRequired" | `step.signalKeyMap.${string}`>, {
        workflow: ["workflowId", "stepNumber", "_creationTime"];
        inProgress: ["step.inProgress", "workflowId", "_creationTime"];
    }, {}, {}>;
    signals: import("convex/server").TableDefinition<import("convex/values").VObject<{
        error?: string | undefined;
        completedAt?: number | undefined;
        helperType?: "any" | "all" | "race" | undefined;
        groupId?: string | undefined;
        validator?: any;
        metadata?: any;
        value?: any;
        cancelReason?: string | undefined;
        waitingStepId?: import("convex/values").GenericId<"steps"> | undefined;
        helperKey?: string | undefined;
        workflowId: import("convex/values").GenericId<"workflows">;
        generationNumber: number;
        name: string;
        state: "pending" | "fulfilled" | "rejected" | "cancelled";
    }, {
        workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
        generationNumber: import("convex/values").VFloat64<number, "required">;
        name: import("convex/values").VString<string, "required">;
        state: import("convex/values").VUnion<"pending" | "fulfilled" | "rejected" | "cancelled", import("convex/values").VLiteral<"pending" | "fulfilled" | "rejected" | "cancelled", "required">[], "required", never>;
        value: import("convex/values").VAny<any, "optional", string>;
        error: import("convex/values").VString<string | undefined, "optional">;
        cancelReason: import("convex/values").VString<string | undefined, "optional">;
        validator: import("convex/values").VAny<any, "optional", string>;
        metadata: import("convex/values").VAny<any, "optional", string>;
        completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
        waitingStepId: import("convex/values").VId<import("convex/values").GenericId<"steps"> | undefined, "optional">;
        helperType: import("convex/values").VUnion<"any" | "all" | "race" | undefined, [import("convex/values").VLiteral<"all", "required">, import("convex/values").VLiteral<"race", "required">, import("convex/values").VLiteral<"any", "required">], "optional", never>;
        groupId: import("convex/values").VString<string | undefined, "optional">;
        helperKey: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "error" | "workflowId" | "generationNumber" | "name" | "state" | "completedAt" | "helperType" | "groupId" | "validator" | `validator.${string}` | "metadata" | `metadata.${string}` | "value" | "cancelReason" | "waitingStepId" | "helperKey" | `value.${string}`>, {
        workflow: ["workflowId", "state", "name", "_creationTime"];
        state: ["state", "workflowId", "_creationTime"];
    }, {}, {}>;
    onCompleteFailures: import("convex/server").TableDefinition<import("convex/values").VUnion<{
        context: any;
        workId: import("@convex-dev/workpool").WorkId;
        result: {
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        };
    } | {
        error: string;
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
    }, [import("convex/values").VObject<{
        context: any;
        workId: import("@convex-dev/workpool").WorkId;
        result: {
            kind: "success";
            returnValue: any;
        } | {
            kind: "failed";
            error: string;
        } | {
            kind: "canceled";
        };
    }, {
        workId: import("convex/values").VString<import("@convex-dev/workpool").WorkId, "required">;
        result: import("convex/values").VUnion<{
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
        context: import("convex/values").VAny<any, "required", string>;
    }, "required", "context" | `context.${string}` | "workId" | "result" | "result.kind" | "result.returnValue" | `result.returnValue.${string}` | "result.error">, import("convex/values").VObject<{
        error: string;
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
        error: import("convex/values").VString<string, "required">;
    }, "required", "error" | "workflowId" | "generationNumber" | "runResult" | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error">], "required", "error" | "workflowId" | "generationNumber" | "context" | `context.${string}` | "runResult" | "runResult.kind" | "runResult.returnValue" | `runResult.returnValue.${string}` | "runResult.error" | "workId" | "result" | "result.kind" | "result.returnValue" | `result.returnValue.${string}` | "result.error">, {}, {}, {}>;
    topics: import("convex/server").TableDefinition<import("convex/values").VObject<{
        name: string;
        validator: any;
        createdAt: number;
    }, {
        name: import("convex/values").VString<string, "required">;
        validator: import("convex/values").VAny<any, "required", string>;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "name" | "validator" | "createdAt" | `validator.${string}`>, {
        by_name: ["name", "_creationTime"];
    }, {}, {}>;
    topicRegistrations: import("convex/server").TableDefinition<import("convex/values").VObject<{
        workflowName?: string | undefined;
        workflowHandle: string;
        createdAt: number;
        topicId: import("convex/values").GenericId<"topics">;
    }, {
        topicId: import("convex/values").VId<import("convex/values").GenericId<"topics">, "required">;
        workflowHandle: import("convex/values").VString<string, "required">;
        workflowName: import("convex/values").VString<string | undefined, "optional">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "workflowHandle" | "createdAt" | "topicId" | "workflowName">, {
        by_topic: ["topicId", "_creationTime"];
    }, {}, {}>;
    events: import("convex/server").TableDefinition<import("convex/values").VObject<{
        completedAt?: number | undefined;
        lastError?: string | undefined;
        idempotencyKey?: string | undefined;
        metadata?: any;
        status: "failed" | "pending" | "dispatching" | "completed";
        createdAt: number;
        topicId: import("convex/values").GenericId<"topics">;
        payload: any;
        retryCount: number;
    }, {
        topicId: import("convex/values").VId<import("convex/values").GenericId<"topics">, "required">;
        payload: import("convex/values").VAny<any, "required", string>;
        status: import("convex/values").VUnion<"failed" | "pending" | "dispatching" | "completed", import("convex/values").VLiteral<"failed" | "pending" | "dispatching" | "completed", "required">[], "required", never>;
        retryCount: import("convex/values").VFloat64<number, "required">;
        lastError: import("convex/values").VString<string | undefined, "optional">;
        idempotencyKey: import("convex/values").VString<string | undefined, "optional">;
        metadata: import("convex/values").VAny<any, "optional", string>;
        createdAt: import("convex/values").VFloat64<number, "required">;
        completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    }, "required", "status" | "completedAt" | "createdAt" | "topicId" | "payload" | "retryCount" | "lastError" | "idempotencyKey" | "metadata" | `payload.${string}` | `metadata.${string}`>, {
        by_topic_status: ["topicId", "status", "_creationTime"];
        by_status: ["status", "_creationTime"];
        by_idempotency: ["topicId", "idempotencyKey", "_creationTime"];
    }, {}, {}>;
    eventWorkflows: import("convex/server").TableDefinition<import("convex/values").VObject<{
        completedAt?: number | undefined;
        workflowId: import("convex/values").GenericId<"workflows">;
        status: "failed" | "canceled" | "pending" | "completed" | "running";
        workflowHandle: string;
        createdAt: number;
        eventId: import("convex/values").GenericId<"events">;
    }, {
        eventId: import("convex/values").VId<import("convex/values").GenericId<"events">, "required">;
        workflowId: import("convex/values").VId<import("convex/values").GenericId<"workflows">, "required">;
        workflowHandle: import("convex/values").VString<string, "required">;
        status: import("convex/values").VUnion<"failed" | "canceled" | "pending" | "completed" | "running", import("convex/values").VLiteral<"failed" | "canceled" | "pending" | "completed" | "running", "required">[], "required", never>;
        createdAt: import("convex/values").VFloat64<number, "required">;
        completedAt: import("convex/values").VFloat64<number | undefined, "optional">;
    }, "required", "workflowId" | "status" | "workflowHandle" | "completedAt" | "createdAt" | "eventId">, {
        by_event: ["eventId", "_creationTime"];
        by_workflow: ["workflowId", "_creationTime"];
        by_event_status: ["eventId", "status", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map