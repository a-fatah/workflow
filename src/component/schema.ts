import {
  vResultValidator,
  type RunResult,
  vWorkIdValidator,
} from "@convex-dev/workpool";
import { defineSchema, defineTable } from "convex/server";
import { convexToJson, type Infer, v, type Value } from "convex/values";
import { logLevel } from "./logging.js";
import { deprecated, literals } from "convex-helpers/validators";
import { vWorkflowId } from "../types.js";

export function valueSize(value: Value): number {
  return JSON.stringify(convexToJson(value)).length;
}

export function resultSize(result: RunResult): number {
  let size = 0;
  size += result.kind.length;
  switch (result.kind) {
    case "success": {
      size += 8 + valueSize(result.returnValue);
      break;
    }
    case "failed": {
      size += result.error.length;
      break;
    }
    case "canceled": {
      break;
    }
  }
  return size;
}

export const vOnComplete = v.object({
  fnHandle: v.string(), // mutation
  context: v.optional(v.any()),
});
export type OnComplete = Infer<typeof vOnComplete>;

const workflowObject = {
  name: v.optional(v.string()),
  workflowHandle: v.string(),
  args: v.any(),
  onComplete: v.optional(vOnComplete),
  logLevel: deprecated,
  startedAt: deprecated,
  state: deprecated,
  // undefined until it's completed
  runResult: v.optional(vResultValidator),

  // Internal execution status, used to totally order mutations.
  generationNumber: v.number(),
};

export const workflowDocument = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  ...workflowObject,
});
export type Workflow = Infer<typeof workflowDocument>;

const baseStepFields = {
  name: v.string(),
  inProgress: v.boolean(),
  workId: v.optional(vWorkIdValidator),
  runResult: v.optional(vResultValidator),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
};

const executionStep = v.object({
  ...baseStepFields,
  type: v.literal("execution"),
  functionType: literals("query", "mutation", "action"),
  handle: v.string(),
  argsSize: v.number(),
  args: v.any(),
});

const pauseStep = v.object({
  ...baseStepFields,
  type: v.literal("pause"),
  onPauseHandle: v.optional(v.string()),
  argsSize: v.number(),
  args: v.any(),
});

const signalStep = v.object({
  ...baseStepFields,
  type: v.literal("signal"),
  signalId: v.id("signals"),
  argsSize: v.number(),
  args: v.any(),
  timeoutMs: v.optional(v.number()),
  timeoutScheduledAt: v.optional(v.number()),
});

export const step = v.union(executionStep, pauseStep, signalStep);
export type Step = Infer<typeof step>;
export type ExecutionStep = Infer<typeof executionStep>;
export type PauseStep = Infer<typeof pauseStep>;
export type SignalStep = Infer<typeof signalStep>;

function stepSize(step: Step): number {
  let size = 0;
  size += step.name.length;
  size += 1; // inProgress
  if (step.workId) {
    size += step.workId.length;
  }
  size += step.type.length;
  
  if (step.type === "execution") {
    size += step.functionType.length;
    size += step.handle.length;
  } else if (step.type === "pause") {
    if (step.onPauseHandle) {
      size += step.onPauseHandle.length;
    }
  } else if (step.type === "signal") {
    size += step.signalId.length;
  }
  
  if ("argsSize" in step) {
    size += 8 + step.argsSize;
  }
  if (step.runResult) {
    size += resultSize(step.runResult);
  }
  size += 8; // startedAt
  size += 8; // completedAt
  return size;
}

const journalObject = {
  workflowId: v.id("workflows"),
  stepNumber: v.number(),
  step,
};

const signalState = literals("pending", "fulfilled", "rejected");

export type SignalState = Infer<typeof signalState>;

export const signalObject = {
  workflowId: v.id("workflows"),
  generationNumber: v.number(),
  name: v.string(),
  state: signalState,
  value: v.optional(v.any()),
  error: v.optional(v.string()),
  validator: v.optional(v.any()),
  metadata: v.optional(v.any()),
  completedAt: v.optional(v.number()),
  waitingStepId: v.optional(v.id("steps")),
}

export const signalDocument = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  ...signalObject,
});

export type SignalDocument = Infer<typeof signalDocument>;

export function journalEntrySize(entry: JournalEntry): number {
  let size = 0;
  size += entry.workflowId.length;
  size += 8; // stepNumber
  size += stepSize(entry.step);
  size += entry._id.length;
  size += 8; // _creationTime
  return size;
}

export const journalDocument = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  ...journalObject,
});
export type JournalEntry = Infer<typeof journalDocument>;

export default defineSchema({
  config: defineTable({
    logLevel: v.optional(logLevel),
    maxParallelism: v.optional(v.number()),
  }),
  workflows: defineTable(workflowObject),
  steps: defineTable(journalObject)
    .index("workflow", ["workflowId", "stepNumber"])
    .index("inProgress", ["step.inProgress", "workflowId"]),
  signals: defineTable(signalObject)
    .index("workflow", ["workflowId", "state", "name"])
    .index("state", ["state", "workflowId"]),
  onCompleteFailures: defineTable(
    v.union(
      v.object({
        workId: vWorkIdValidator,
        result: vResultValidator,
        context: v.any(),
      }),
      v.object({
        workflowId: v.id("workflows"),
        generationNumber: v.number(),
        runResult: vResultValidator,
        error: v.string(),
      }),
    ),
  ),
});
