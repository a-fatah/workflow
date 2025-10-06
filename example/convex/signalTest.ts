import { v } from "convex/values";
import { WorkflowId, WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { mutation } from "./_generated/server";

const workflow = new WorkflowManager(components.workflow);

export const { mutation: workflowMutation, signals} = workflow.define({
  args: {
    orderId: v.string(),
    amount: v.number(),
  },
  
  signals: {
    paymentConfirmed: v.object({ 
      transactionId: v.string(), 
      amount: v.number() 
    }),
    inventoryChecked: v.object({ 
      available: v.boolean(), 
      warehouseId: v.string() 
    }),
    shippingApproved: v.object({
      approved: v.boolean(),
      reason: v.optional(v.string()),
    }),
  },

  async handler(ctx, args) {
    console.log(`Processing order ${args.orderId} for amount ${args.amount}`);
    const paymentSignal = await ctx.signals.create("paymentConfirmed");
    
    const inventorySignal = await ctx.signals.create("inventoryChecked");

    const shippingSignal = await ctx.signals.create("shippingApproved");

    const dynamicApprovalSignal = await ctx.signals.create(
      `manager-approval-${args.orderId}`,
      { returns: v.object({ approved: v.boolean(), managerId: v.string() }) }
    );

    const payment = await ctx.signals.awaitSignal(paymentSignal);
    console.log(`Payment confirmed: ${payment.transactionId} for $${payment.amount}`);

    const inventory = await ctx.signals.awaitSignal(inventorySignal);
    
    if (!inventory.available) {
      console.log(`Order ${args.orderId} cancelled - out of stock`);
      return { success: false, reason: "Out of stock" };
    }

    console.log(`Inventory confirmed at warehouse ${inventory.warehouseId}`);

    const allSignals = await ctx.signals.all({
      shipping: shippingSignal,
      approval: dynamicApprovalSignal,
    });

    if (!allSignals.shipping.approved) {
      return { 
        success: false, 
        reason: allSignals.shipping.reason || "Shipping not approved" 
      };
    }

    console.log(`Order ${args.orderId} completed successfully`);
    return { 
      success: true, 
      transactionId: payment.transactionId,
      warehouseId: inventory.warehouseId,
    };
  },

  returns: v.object({
    success: v.boolean(),
    transactionId: v.optional(v.string()),
    warehouseId: v.optional(v.string()),
    reason: v.optional(v.string()),
  }),
});

export const handlePaymentWebhook = mutation({
  args: { 
    signalId: v.string(), 
    transactionId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await signals?.paymentConfirmed.resolve(
      ctx,
      args.signalId,
      { 
        transactionId: args.transactionId,
        amount: args.amount,
      }
    );
  },
});

export const handleInventoryCheck = mutation({
  args: {
    signalId: v.string(),
    available: v.boolean(),
    warehouseId: v.string(),
  },
  handler: async (ctx, args) => {
    await signals?.inventoryChecked.resolve(
      ctx,
      args.signalId,
      {
        available: args.available,
        warehouseId: args.warehouseId,
      }
    );
  },
});

export const rejectShipping = mutation({
  args: {
    signalId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await signals?.shippingApproved.reject(
      ctx,
      args.signalId,
      args.reason
    );
  },
});

export const startOrderWorkflow = mutation({
  args: {
    orderId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const workflowId: WorkflowId = await workflow.start(
      ctx,
      internal.signalTest.workflowMutation,
      {
        orderId: args.orderId,
        amount: args.amount,
      }
    );
    
    return { workflowId };
  },
});
