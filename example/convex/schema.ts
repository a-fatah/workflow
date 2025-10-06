import { defineTable, defineSchema } from "convex/server";
import { v } from "convex/values";
import { vWorkflowId } from "@convex-dev/workflow";

export default defineSchema({
  flows: defineTable({
    in: v.string(),
    workflowId: vWorkflowId,
    out: v.any(),
  }).index("workflowId", ["workflowId"]),
  subscriptions: defineTable({
    userId: v.string(),
    status: v.union(v.literal("trial"), v.literal("active")),
    tier: v.union(v.literal("free"), v.literal("premium")),
    trialEndDate: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
    downgradedAt: v.optional(v.number()),
  }).index("userId", ["userId"]),
});
