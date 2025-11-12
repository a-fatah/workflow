import { v } from "convex/values";
export const vWorkflowId = v.string();
export const vSignalHandle = v.object({
    signalId: v.string(),
    workflowId: v.string(),
    generationNumber: v.number(),
    name: v.string(),
});
//# sourceMappingURL=types.js.map