import { assert } from "convex-helpers";
import { validate, ValidationError } from "convex-helpers/validators";
import { v } from "convex/values";
import type { FunctionHandle } from "convex/server";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server.js";
import { getWorkflow } from "./model.js";
import { getWorkpool } from "./pool.js";
import { getDefaultLogger } from "./utils.js";
import { internal } from "./_generated/api.js";
import {
  signalDocument,
  type SignalDocument,
  type SignalState,
} from "./schema.js";
import { vSignalHandle, type SignalHandle, type WorkflowId } from "../types.js";
import type { Id } from "./_generated/dataModel.js";

export const create = mutation({
  args: {
    workflowId: v.id("workflows"),
    generationNumber: v.number(),
    name: v.string(),
    metadata: v.optional(v.any()),
    validator: v.optional(v.any()),
  },
  returns: vSignalHandle,
  handler: async (ctx, args) => {
    const workflow = await getWorkflow(ctx, args.workflowId, args.generationNumber);
    if (workflow.runResult) {
      throw new Error(
        `Workflow not running: ${args.workflowId} (generation ${args.generationNumber})`,
      );
    }
    
    const existingSignal = await ctx.db
      .query("signals")
      .withIndex("workflow", (q) => q.eq("workflowId", workflow._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existingSignal) {
      return {
        signalId: existingSignal._id,
        workflowId: workflow._id,
        generationNumber: workflow.generationNumber,
        name: existingSignal.name,
      } satisfies SignalHandle;
    }
    
    const signalId = await ctx.db.insert("signals", {
      workflowId: workflow._id,
      generationNumber: workflow.generationNumber,
      name: args.name,
      state: "pending" as SignalState,
      value: undefined,
      error: undefined,
      metadata: args.metadata,
      validator: args.validator,
      completedAt: undefined,
    });
    const document = await ctx.db.get(signalId);
    assert(document, "Signal document not found after creation");
    const console = await getDefaultLogger(ctx);
    console.event("signalCreated", {
      workflowId: workflow._id,
      workflowName: workflow.name,
      signalId: document._id,
      signalName: document.name,
    });
    return {
      signalId: document._id,
      workflowId: workflow._id,
      generationNumber: workflow.generationNumber,
      name: document.name,
    } satisfies SignalHandle;
  },
});

export const load = query({
  args: {
    signalId: v.id("signals"),
  },
  returns: signalDocument,
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    assert(signal, `Signal not found: ${args.signalId}`);
    return signal;
  },
});

export const resolve = mutation({
  args: {
    signalId: v.id("signals"),
    value: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    assert(signal, `Signal not found: ${args.signalId}`);
    if (signal.state !== "pending") {
      throw new Error(`Signal already completed: ${args.signalId}`);
    }
    if (signal.validator) {
      try {
        validate(signal.validator, args.value, { throw: true });
      } catch (error) {
        const message =
          error instanceof ValidationError ? error.message : String(error);
        throw new Error(`Signal resolution failed validation: ${message}`);
      }
    }
    signal.state = "fulfilled";
    signal.value = args.value;
    signal.metadata = args.metadata ?? signal.metadata;
    signal.completedAt = Date.now();
    const hadWaitingStep = await completeWaitingStep(
      ctx,
      signal.waitingStepId,
      {
        kind: "success",
        returnValue: signal.value,
      },
    );
    if (hadWaitingStep) {
      signal.waitingStepId = undefined;
    }
    await ctx.db.replace(args.signalId, signal);
    if (hadWaitingStep) {
      await resumeWorkflow(ctx, signal);
    }
  },
});

export const reject = mutation({
  args: {
    signalId: v.id("signals"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    assert(signal, `Signal not found: ${args.signalId}`);
    if (signal.state !== "pending") {
      throw new Error(`Signal already completed: ${args.signalId}`);
    }
    signal.state = "rejected";
    signal.error = args.error;
    signal.completedAt = Date.now();
    const hadWaitingStep = await completeWaitingStep(
      ctx,
      signal.waitingStepId,
      {
        kind: "failed",
        error: signal.error,
      },
    );
    if (hadWaitingStep) {
      signal.waitingStepId = undefined;
    }
    await ctx.db.replace(args.signalId, signal);
    if (hadWaitingStep) {
      await resumeWorkflow(ctx, signal);
    }
  },
});

export const cancel = mutation({
  args: {
    signalId: v.id("signals"),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    assert(signal, `Signal not found: ${args.signalId}`);
    if (signal.state !== "pending") {
      throw new Error(`Signal already completed: ${args.signalId}`);
    }
    signal.state = "cancelled";
    signal.cancelReason = args.reason;
    signal.completedAt = Date.now();
    const hadWaitingStep = await completeWaitingStep(
      ctx,
      signal.waitingStepId,
      {
        kind: "failed",
        error: `Signal cancelled: ${args.reason}`,
      },
    );
    if (hadWaitingStep) {
      signal.waitingStepId = undefined;
    }
    await ctx.db.replace(args.signalId, signal);
    if (hadWaitingStep) {
      await resumeWorkflow(ctx, signal);
    }
  },
});

async function resumeWorkflow(ctx: MutationCtx, signal: SignalDocument) {
  const workflow = await getWorkflow(ctx, signal.workflowId, null);
  if (workflow.runResult) {
    return;
  }
  const console = await getDefaultLogger(ctx);
  console.event("signalCompleted", {
    workflowId: workflow._id,
    workflowName: workflow.name,
    signalId: signal._id,
    signalName: signal.name,
    state: signal.state,
  });
  const workpool = await getWorkpool(ctx, {});
  await workpool.enqueueMutation(
    ctx,
    workflow.workflowHandle as FunctionHandle<"mutation">,
    {
      workflowId: workflow._id,
      generationNumber: workflow.generationNumber,
    },
    {
      name: workflow.name,
      onComplete: internal.pool.handlerOnComplete,
      context: {
        workflowId: workflow._id,
        generationNumber: workflow.generationNumber,
      },
    },
  );
}

export const handleTimeout = internalMutation({
  args: {
    stepId: v.id("steps"),
    signalId: v.id("signals"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    
    if (!signal || signal.state !== "pending") {
      return;
    }
    
    const step = await ctx.db.get(args.stepId);
    if (!step || !step.step.inProgress) {
      return;
    }
    
    const timeoutMs = step.step.type === "signal" ? step.step.timeoutMs : undefined;
    const errorMessage = timeoutMs 
      ? `Signal timed out after ${timeoutMs}ms`
      : "Signal timed out";
    
    signal.state = "rejected";
    signal.error = errorMessage;
    signal.completedAt = Date.now();
    
    const hadWaitingStep = await completeWaitingStep(
      ctx,
      signal.waitingStepId,
      {
        kind: "failed",
        error: errorMessage,
      }
    );
    
    if (hadWaitingStep) {
      signal.waitingStepId = undefined;
    }
    
    await ctx.db.replace(args.signalId, signal);
    
    if (hadWaitingStep) {
      await resumeWorkflow(ctx, signal);
    }
  },
});

async function completeWaitingStep(
  ctx: MutationCtx,
  waitingStepId: SignalDocument["waitingStepId"],
  runResult:
    | { kind: "success"; returnValue: unknown }
    | { kind: "failed"; error?: string },
): Promise<boolean> {
  if (!waitingStepId) {
    return false;
  }
  const normalizedStepId = ctx.db.normalizeId("steps", waitingStepId);
  if (!normalizedStepId) {
    return false;
  }
  const stepEntry = await ctx.db.get(normalizedStepId as Id<"steps">);
  if (!stepEntry) {
    return false;
  }
  stepEntry.step.inProgress = false;
  stepEntry.step.completedAt = Date.now();
  if (runResult.kind === "success") {
    stepEntry.step.runResult = {
      kind: "success",
      returnValue: runResult.returnValue,
    };
  } else {
    stepEntry.step.runResult = {
      kind: "failed",
      error: runResult.error ?? "Signal rejected",
    };
  }
  await ctx.db.replace(normalizedStepId, stepEntry);
  return true;
}
