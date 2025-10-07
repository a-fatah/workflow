/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema.js";
import { api, internal } from "./_generated/api.js";

const modules = import.meta.glob("./**/*.*s");

import componentSchema from "../../node_modules/@convex-dev/workpool/src/component/schema.js";
const componentModules = import.meta.glob(
  "../../node_modules/@convex-dev/workpool/src/component/**/*.ts",
);

function initConvexTest() {
  const t = convexTest(schema, modules);
  t.registerComponent("workpool", componentSchema, componentModules);
  return t;
}

describe("Signal Timeout", () => {
  let t: ReturnType<typeof initConvexTest>;

  beforeEach(async () => {
    vi.useFakeTimers();
    t = initConvexTest();
  });

  afterEach(async () => {
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    vi.useRealTimers();
  });

  test("signal times out after specified duration", async () => {
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
          timeoutMs: 5000,
          timeoutScheduledAt: Date.now(),
        },
      });

      const signal = await ctx.db.get(signalId);
      if (signal) {
        signal.waitingStepId = stepId;
        await ctx.db.replace(signalId, signal);
      }

      return signalId;
    });

    const signalBefore = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });
    expect(signalBefore?.state).toBe("pending");

    vi.advanceTimersByTime(6000);
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const signalAfter = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });
    expect(signalAfter?.state).toBe("rejected");
    expect(signalAfter?.error).toContain("timed out after 5000ms");
  });

  test("signal resolved before timeout does not trigger timeout", async () => {
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
          timeoutMs: 5000,
          timeoutScheduledAt: Date.now(),
        },
      });

      const signal = await ctx.db.get(signalId);
      if (signal) {
        signal.waitingStepId = stepId;
        await ctx.db.replace(signalId, signal);
      }

      return { signalId, stepId };
    });

    await t.mutation(api.signals.resolve, {
      signalId,
      value: { success: true },
    });

    const signalAfterResolve = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });
    expect(signalAfterResolve?.state).toBe("fulfilled");
    expect(signalAfterResolve?.value).toEqual({ success: true });

    vi.advanceTimersByTime(6000);
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const signalAfterTimeout = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });
    expect(signalAfterTimeout?.state).toBe("fulfilled");
    expect(signalAfterTimeout?.error).toBeUndefined();
  });

  test("timeout handler is idempotent", async () => {
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
          timeoutMs: 1000,
          timeoutScheduledAt: Date.now(),
        },
      });

      const signal = await ctx.db.get(signalId);
      if (signal) {
        signal.waitingStepId = stepId;
        await ctx.db.replace(signalId, signal);
      }

      return { signalId, stepId };
    });

    await t.mutation(internal.signals.handleTimeout, { signalId, stepId });
    
    const signalAfterFirstTimeout = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });
    expect(signalAfterFirstTimeout?.state).toBe("rejected");

    await t.mutation(internal.signals.handleTimeout, { signalId, stepId });
    
    const signalAfterSecondTimeout = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });
    expect(signalAfterSecondTimeout?.state).toBe("rejected");
    expect(signalAfterSecondTimeout?.error).toBe(signalAfterFirstTimeout?.error);
  });

  test("timeout error message includes duration", async () => {
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
          timeoutMs: 30000,
          timeoutScheduledAt: Date.now(),
        },
      });

      const signal = await ctx.db.get(signalId);
      if (signal) {
        signal.waitingStepId = stepId;
        await ctx.db.replace(signalId, signal);
      }

      return { signalId, stepId };
    });

    await t.mutation(internal.signals.handleTimeout, { signalId, stepId });

    const signal = await t.run(async (ctx) => {
      return await ctx.db.get(signalId);
    });
    
    expect(signal?.error).toBe("Signal timed out after 30000ms");
  });

  test("timeout does not affect already completed workflow", async () => {
    const { signalId, stepId, workflowId } = await t.run(async (ctx) => {
      const workflowId = await ctx.db.insert("workflows", {
        name: "test-workflow",
        workflowHandle: "test",
        args: {},
        generationNumber: 0,
        runResult: { kind: "success", returnValue: { done: true } },
      });

      const signalId = await ctx.db.insert("signals", {
        workflowId,
        generationNumber: 0,
        name: "testSignal",
        state: "pending",
        value: undefined,
        error: undefined,
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
          timeoutMs: 1000,
          timeoutScheduledAt: Date.now(),
        },
      });

      return { signalId, stepId, workflowId };
    });

    await t.mutation(internal.signals.handleTimeout, { signalId, stepId });

    const workflow = await t.run(async (ctx) => {
      return await ctx.db.get(workflowId);
    });

    expect(workflow?.runResult).toEqual({ kind: "success", returnValue: { done: true } });
  });
});
