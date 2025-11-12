export declare const create: import("convex/server").RegisteredMutation<"public", {
    validator?: any;
    metadata?: any;
    workflowId: import("convex/values").GenericId<"workflows">;
    generationNumber: number;
    name: string;
}, Promise<{
    signalId: import("convex/values").GenericId<"signals">;
    workflowId: import("convex/values").GenericId<"workflows">;
    generationNumber: number;
    name: string;
}>>;
export declare const load: import("convex/server").RegisteredQuery<"public", {
    signalId: import("convex/values").GenericId<"signals">;
}, Promise<{
    _id: import("convex/values").GenericId<"signals">;
    _creationTime: number;
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
}>>;
export declare const resolve: import("convex/server").RegisteredMutation<"public", {
    metadata?: any;
    value?: any;
    signalId: import("convex/values").GenericId<"signals">;
}, Promise<void>>;
export declare const reject: import("convex/server").RegisteredMutation<"public", {
    error: string;
    signalId: import("convex/values").GenericId<"signals">;
}, Promise<void>>;
export declare const cancel: import("convex/server").RegisteredMutation<"public", {
    signalId: import("convex/values").GenericId<"signals">;
    reason: string;
}, Promise<void>>;
export declare const updateMetadata: import("convex/server").RegisteredMutation<"public", {
    signalId: import("convex/values").GenericId<"signals">;
    metadata: any;
}, Promise<void>>;
export declare const handleTimeout: import("convex/server").RegisteredMutation<"internal", {
    signalId: import("convex/values").GenericId<"signals">;
    stepId: import("convex/values").GenericId<"steps">;
}, Promise<void>>;
//# sourceMappingURL=signals.d.ts.map