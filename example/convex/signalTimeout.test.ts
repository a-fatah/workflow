/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test";
import { components, internal } from "./_generated/api";
import { WorkflowManager, WorkflowStatus } from "../../src/client";

describe("Signal Timeout Integration", () => {
  let t: Awaited<ReturnType<typeof initConvexTest>>;
  let workflowManager: WorkflowManager;

  beforeEach(async () => {
    vi.useFakeTimers();
    t = initConvexTest();
    workflowManager = new WorkflowManager(components.workflow);
  });

  afterEach(async () => {
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    vi.useRealTimers();
  });

  test("signal times out when not resolved", async () => {
    const { workflowId } = await t.mutation(
      internal.signalTimeoutTest.startTimeoutWorkflow,
      {
        orderId: "test-123",
        timeoutMs: 5000,
      },
    );

    await t.finishAllScheduledFunctions(vi.runAllTimers);

    await t.run(async (ctx) => {
      const status = await workflowManager.status(ctx, workflowId);
      assertInProgress(status);
      expect(status.running).toHaveLength(1);
    });

    vi.advanceTimersByTime(6000);
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const postTimeoutStatus = await t.run(async (ctx) => {
      return await workflowManager.status(ctx, workflowId);
    });
    assertInProgress(postTimeoutStatus);
    expect(postTimeoutStatus.running).toHaveLength(1);

    const finalWorkflowStatus = await t.query(
      components.workflow.workflow.getStatus,
      { workflowId },
    );
    expect(finalWorkflowStatus.workflow.runResult).toMatchObject({
      kind: "success",
      returnValue: {
        success: false,
        timedOut: true,
        reason: "timeout",
      },
    });
  });

  test("signal resolved before timeout does not trigger timeout", async () => {
    const { workflowId } = await t.mutation(
      internal.signalTimeoutTest.startTimeoutWorkflow,
      {
        orderId: "test-456",
        timeoutMs: 10000,
      },
    );

    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const status = await t.run(async (ctx) => {
      return await workflowManager.status(ctx, workflowId);
    });

    assertInProgress(status);

    const runningSignalStep = status.running.find((step) => step.type === "signal");
    const signalId = runningSignalStep?.signalId ?? null;
    expect(signalId).not.toBeNull();

    await t.mutation(internal.signalTimeoutTest.resolvePayment, {
      signalId: signalId!,
      paymentId: "pay_123",
      amount: 100,
    });

    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const resolvedStatus = await t.query(
      components.workflow.workflow.getStatus,
      { workflowId },
    );
    expect(resolvedStatus.workflow.runResult).toMatchObject({
      kind: "success",
      returnValue: {
        success: true,
        paymentId: "pay_123",
        timedOut: false,
      },
    });

    vi.advanceTimersByTime(15000);
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const finalStatus = await t.query(
      components.workflow.workflow.getStatus,
      { workflowId },
    );
    expect(finalStatus.workflow.runResult).toMatchObject({
      kind: "success",
      returnValue: {
        success: true,
        paymentId: "pay_123",
        timedOut: false,
      },
    });
  });

  test("very short timeout fires immediately", async () => {
    const { workflowId } = await t.mutation(
      internal.signalTimeoutTest.startTimeoutWorkflow,
      {
        orderId: "test-789",
        timeoutMs: 100,
      },
    );

    await t.finishAllScheduledFunctions(vi.runAllTimers);

    vi.advanceTimersByTime(150);
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const postTimeoutStatus = await t.run(async (ctx) => {
      return await workflowManager.status(ctx, workflowId);
    });
    assertInProgress(postTimeoutStatus);
    expect(postTimeoutStatus.running).toHaveLength(1);

    const finalWorkflowStatus = await t.query(
      components.workflow.workflow.getStatus,
      { workflowId },
    );
    expect(finalWorkflowStatus.workflow.runResult).toMatchObject({
      kind: "success",
      returnValue: {
        success: false,
        timedOut: true,
        reason: "timeout",
      },
    });
  });
});

function assertInProgress(status: WorkflowStatus): asserts status is Extract<
  WorkflowStatus,
  { type: "inProgress" }
> {
  if (status.type !== "inProgress") {
    throw new Error(`Expected inProgress, got ${status.type}`);
  }
}
