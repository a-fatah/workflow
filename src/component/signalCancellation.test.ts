/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema.js";
import { api, components } from "./_generated/api.js";

const modules = import.meta.glob("./**/*.*s");

import componentSchema from "../../node_modules/@convex-dev/workpool/src/component/schema.js";
import workflowSchema from "./schema.js";
const componentModules = import.meta.glob(
  "../../node_modules/@convex-dev/workpool/src/component/**/*.ts",
);
const workflowModules = import.meta.glob("./**/*.ts");

function initConvexTest() {
  const t = convexTest(schema, modules);
  t.registerComponent("workpool", componentSchema, componentModules);
  t.registerComponent("workflow", workflowSchema, workflowModules);
  return t;
}

describe("Signal Cancellation", () => {
  let t: ReturnType<typeof initConvexTest>;

  beforeEach(async () => {
    vi.useFakeTimers();
    t = initConvexTest();
  });

  afterEach(async () => {
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    vi.useRealTimers();
  });

  test("signal cancellation marks state as cancelled", async () => {
    const signalId = await t.run(async (ctx) => {
      const workflowId = await ctx.db.insert("workflows", {
        name: "test-workflow",
        workflowHandle: "test",
        args: {},
        generationNumber: 0,
        runResult: undefined,
      });

      const signalId = await ctx.db.insert("signals", {
        workflowId,
        generationNumber: 0,
        name: "testSignal",
        state: "pending",
        value: undefined,
        error: undefined,
        cancelReason: undefined,
        metadata: undefined,
        validator: undefined,
        completedAt: undefined,
        waitingStepId: undefined,
      });

      return signalId;
    });

    await t.mutation(api.signals.cancel, {
      signalId,
      reason: "User cancelled order",
    });

    const signal = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });

    expect(signal?.state).toBe("cancelled");
    expect(signal?.cancelReason).toBe("User cancelled order");
    expect(signal?.completedAt).toBeDefined();
  });

  test("cancelled signal cannot be resolved", async () => {
    const signalId = await t.run(async (ctx) => {
      const workflowId = await ctx.db.insert("workflows", {
        name: "test-workflow",
        workflowHandle: "test",
        args: {},
        generationNumber: 0,
        runResult: undefined,
      });

      const signalId = await ctx.db.insert("signals", {
        workflowId,
        generationNumber: 0,
        name: "testSignal",
        state: "pending",
        value: undefined,
        error: undefined,
        cancelReason: undefined,
        metadata: undefined,
        validator: undefined,
        completedAt: undefined,
        waitingStepId: undefined,
      });

      return signalId;
    });

    await t.mutation(api.signals.cancel, {
      signalId,
      reason: "User cancelled",
    });

    await expect(
      t.mutation(api.signals.resolve, {
        signalId,
        value: { success: true },
      })
    ).rejects.toThrow("Signal already completed");
  });

  test("cancelling already-completed signal throws error", async () => {
    const signalId = await t.run(async (ctx) => {
      const workflowId = await ctx.db.insert("workflows", {
        name: "test-workflow",
        workflowHandle: "test",
        args: {},
        generationNumber: 0,
        runResult: undefined,
      });

      const signalId = await ctx.db.insert("signals", {
        workflowId,
        generationNumber: 0,
        name: "testSignal",
        state: "pending",
        value: undefined,
        error: undefined,
        cancelReason: undefined,
        metadata: undefined,
        validator: undefined,
        completedAt: undefined,
        waitingStepId: undefined,
      });

      return signalId;
    });

    await t.mutation(api.signals.resolve, {
      signalId,
      value: { success: true },
    });

    await expect(
      t.mutation(api.signals.cancel, {
        signalId,
        reason: "User cancelled",
      })
    ).rejects.toThrow("Signal already completed");
  });

  test("workflow resumes with cancellation error", async () => {
    const { signalId, stepId } = await t.run(async (ctx) => {
      const workflowId = await ctx.db.insert("workflows", {
        name: "test-workflow",
        workflowHandle: "test",
        args: {},
        generationNumber: 0,
        runResult: undefined,
      });

      const signalId = await ctx.db.insert("signals", {
        workflowId,
        generationNumber: 0,
        name: "testSignal",
        state: "pending",
        value: undefined,
        error: undefined,
        cancelReason: undefined,
        metadata: undefined,
        validator: undefined,
        completedAt: undefined,
        waitingStepId: undefined,
      });

      const stepId = await ctx.db.insert("steps", {
        workflowId,
        stepNumber: 0,
        step: {
          type: "signal",
          name: "testSignal",
          signalId,
          args: { signalId },
          argsSize: 50,
          inProgress: true,
          runResult: undefined,
          startedAt: Date.now(),
          completedAt: undefined,
        },
      });

      const signal = await ctx.db.get(signalId);
      if (signal) {
        signal.waitingStepId = stepId;
        await ctx.db.replace(signalId, signal);
      }

      return { signalId, stepId };
    });

    await t.mutation(api.signals.cancel, {
      signalId,
      reason: "User cancelled order",
    });

    const step = await t.run(async (ctx) => {
      return await ctx.db.get(stepId);
    });

    expect(step?.step.inProgress).toBe(false);
    expect(step?.step.runResult).toEqual({
      kind: "failed",
      error: "Signal cancelled: User cancelled order",
    });
  });

  test("cancellation reason is stored and queryable", async () => {
    const signalId = await t.run(async (ctx) => {
      const workflowId = await ctx.db.insert("workflows", {
        name: "test-workflow",
        workflowHandle: "test",
        args: {},
        generationNumber: 0,
        runResult: undefined,
      });

      const signalId = await ctx.db.insert("signals", {
        workflowId,
        generationNumber: 0,
        name: "paymentSignal",
        state: "pending",
        value: undefined,
        error: undefined,
        cancelReason: undefined,
        metadata: undefined,
        validator: undefined,
        completedAt: undefined,
        waitingStepId: undefined,
      });

      return signalId;
    });

    const customReason = "Payment timeout exceeded";
    await t.mutation(api.signals.cancel, {
      signalId,
      reason: customReason,
    });

    const signal = await t.query(api.signals.load, { signalId });

    expect(signal.state).toBe("cancelled");
    expect(signal.cancelReason).toBe(customReason);
  });

  test("concurrent cancel operations are idempotent", async () => {
    const signalId = await t.run(async (ctx) => {
      const workflowId = await ctx.db.insert("workflows", {
        name: "test-workflow",
        workflowHandle: "test",
        args: {},
        generationNumber: 0,
        runResult: undefined,
      });

      const signalId = await ctx.db.insert("signals", {
        workflowId,
        generationNumber: 0,
        name: "testSignal",
        state: "pending",
        value: undefined,
        error: undefined,
        cancelReason: undefined,
        metadata: undefined,
        validator: undefined,
        completedAt: undefined,
        waitingStepId: undefined,
      });

      return signalId;
    });

    await t.mutation(api.signals.cancel, {
      signalId,
      reason: "First cancellation",
    });

    await expect(
      t.mutation(api.signals.cancel, {
        signalId,
        reason: "Second cancellation",
      })
    ).rejects.toThrow("Signal already completed");

    const signal = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });

    expect(signal?.state).toBe("cancelled");
    expect(signal?.cancelReason).toBe("First cancellation");
  });
});
