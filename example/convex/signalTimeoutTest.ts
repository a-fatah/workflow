import { v } from "convex/values";
import { WorkflowId, WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";

const workflow = new WorkflowManager(components.workflow);

export const { mutation: timeoutWorkflowMutation, signals } = workflow.define({
  args: {
    orderId: v.string(),
    timeoutMs: v.number(),
  },
  
  signals: {
    payment: v.object({ 
      paymentId: v.string(),
      amount: v.number(),
    }),
  },

  async handler(ctx, args) {
    console.log(`Starting timeout test workflow for order ${args.orderId}`);
    
    const paymentSignal = await ctx.signals.create("payment");
    console.log(`Created payment signal: ${paymentSignal.signalId}`);

    try {
      const payment = await ctx.signals.awaitSignal(paymentSignal, {
        timeoutMs: args.timeoutMs,
      });
      console.log(`Payment received: ${payment.paymentId}`);
      return { 
        success: true, 
        paymentId: payment.paymentId,
        timedOut: false,
      };
    } catch (error: any) {
      if (error.message && error.message.includes("timed out")) {
        console.log(`Payment timed out after ${args.timeoutMs}ms`);
        return { 
          success: false, 
          reason: "timeout",
          timedOut: true,
        };
      }
      throw error;
    }
  },

  returns: v.object({
    success: v.boolean(),
    paymentId: v.optional(v.string()),
    reason: v.optional(v.string()),
    timedOut: v.boolean(),
  }),
});

export const startTimeoutWorkflow = internalMutation({
  args: {
    orderId: v.string(),
    timeoutMs: v.number(),
  },
  handler: async (ctx, args) => {
    const workflowId: WorkflowId = await workflow.start(
      ctx,
      internal.signalTimeoutTest.timeoutWorkflowMutation,
      {
        orderId: args.orderId,
        timeoutMs: args.timeoutMs,
      }
    );
    
    return { workflowId };
  },
});

export const resolvePayment = internalMutation({
  args: {
    signalId: v.string(),
    paymentId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await signals?.payment.resolve(
      ctx,
      args.signalId,
      {
        paymentId: args.paymentId,
        amount: args.amount,
      }
    );
  },
});
