import { v, type Validator } from "convex/values";
import {
  WorkflowManager,
  vWorkflowId,
  type WorkflowId,
} from "@convex-dev/workflow";
import { internal } from "./_generated/api.js";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { WorkflowStep } from "../../src/client/types.js";

export const workflow = new WorkflowManager(components.workflow);

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export const { mutation: subscriptionTrialWorkflow, signals } = workflow.define({
  args: {
    userId: v.string(),
    email: v.string(),
    trialEndDate: v.number(),
  },
  signals: {
    userDecision: v.union(
      v.object({
        decision: v.literal("upgrade"),
        paymentMethodId: v.string(),
      }),
      v.object({ decision: v.literal("decline") }),
    ),
    retentionDecision: v.union(
      v.object({
        decision: v.literal("accepted"),
        paymentMethodId: v.string(),
      }),
      v.object({ decision: v.literal("declined") }),
    ),
    paymentRetry: v.union(
      v.object({
        decision: v.literal("retry"),
        paymentMethodId: v.string(),
      }),
      v.object({ decision: v.literal("cancel") }),
    ),
    provisioningComplete: v.object({ provisioningId: v.string() }),
    paymentFailed: v.object({ error: v.string() }),
    paymentSuccess: v.object({ transactionId: v.string() }),
    trialExpired: v.null(),
    subscriptionActivated: v.null(),
    subscriptionDowngraded: v.null(),
    subscriptionCancelled: v.null(),
  },
  handler: async (step, args) => {
    console.log(`Starting subscription trial workflow for user ${args.userId}`);

    await step.runMutation(internal.subscriptionTrial.initializeTrial, {
      userId: args.userId,
      trialEndDate: args.trialEndDate,
    });

    const scheduledTime = args.trialEndDate;
    const userDecisionSignal = await step.signals.create("userDecision");

    console.log(
      `Trial expired for user ${args.userId}, sending upgrade prompt`,
    );
    await step.runAction(internal.subscriptionTrial.sendUpgradePrompt, {
      userId: args.userId,
      email: args.email,
    });

    const userDecision = await step.signals.awaitSignal(userDecisionSignal);

    if (!userDecision || userDecision.decision === "decline") {
      console.log(
        `User ${args.userId} declined upgrade, sending retention offer`,
      );
      await step.runAction(internal.subscriptionTrial.sendRetentionOffer, {
        userId: args.userId,
        email: args.email,
      });

      const retentionResponseSignal = await step.signals.create("retentionDecision");

      const retentionResponse = await step.signals.awaitSignal(retentionResponseSignal);

      if (!retentionResponse || retentionResponse.decision === "declined") {
        console.log(
          `User ${args.userId} declined retention offer, downgrading to free`,
        );
        await step.runMutation(internal.subscriptionTrial.downgradeToFree, {
          userId: args.userId,
        });
        await step.runAction(internal.subscriptionTrial.sendDowngradeNotice, {
          userId: args.userId,
          email: args.email,
        });
        return { status: "downgraded" as const };
      }

      await processUpgrade(
        step,
        args.userId,
        retentionResponse.paymentMethodId,
      );
      return { status: "upgraded_after_retention" as const };
    }

    await processUpgrade(step, args.userId, userDecision.paymentMethodId);
    return { status: "upgraded" as const };
  },
  returns: v.object({
    status: v.union(
      v.literal("upgraded"),
      v.literal("upgraded_after_retention"),
      v.literal("downgraded"),
    ),
  }),
});

async function processUpgrade(
  step: WorkflowStep,
  userId: string,
  paymentMethodId: string,
) {
  console.log(`Processing payment for user ${userId}`);
  const paymentResult = await step.runAction(
    internal.subscriptionTrial.processPayment,
    {
      userId,
      paymentMethodId,
    },
  );

  if (!paymentResult.success) {
    console.log(`Payment failed for user ${userId}, waiting for retry`);
    const retryDecision = await step.pause({
      name: "waitPaymentRetry",
      returns: v.union(
        v.object({
          decision: v.literal("retry"),
          paymentMethodId: v.string(),
        }),
        v.object({ decision: v.literal("cancel") }),
      ) as unknown as Validator<
        { decision: "retry"; paymentMethodId: string } | { decision: "cancel" },
        "required"
      >,
    });

    if (!retryDecision || retryDecision.decision === "cancel") {
      console.log(`User ${userId} cancelled payment retry, downgrading`);
      await step.runMutation(internal.subscriptionTrial.downgradeToFree, {
        userId,
      });
      throw new Error("Payment cancelled by user");
    }

    const retryResult = await step.runAction(
      internal.subscriptionTrial.processPayment,
      {
        userId,
        paymentMethodId: retryDecision.paymentMethodId,
      },
    );

    if (!retryResult.success) {
      console.log(`Payment retry failed for user ${userId}`);
      await step.runMutation(internal.subscriptionTrial.downgradeToFree, {
        userId,
      });
      throw new Error("Payment retry failed");
    }
  }

  console.log(`Payment successful for user ${userId}, provisioning resources`);
  await step.runAction(internal.subscriptionTrial.provisionPremiumResources, {
    userId,
  });

  await step.pause({
    name: "waitProvisioningComplete",
    returns: v.object({ provisioningId: v.string() }) as unknown as Validator<
      { provisioningId: string },
      "required"
    >,
  });

  console.log(`Provisioning complete for user ${userId}, activating premium`);
  await step.runMutation(internal.subscriptionTrial.activatePremium, {
    userId,
  });

  await step.runAction(internal.subscriptionTrial.sendConfirmationEmail, {
    userId,
  });
}

export const initializeTrial = internalMutation({
  args: {
    userId: v.string(),
    trialEndDate: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "trial",
        trialEndDate: args.trialEndDate,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        status: "trial",
        tier: "free",
        trialEndDate: args.trialEndDate,
      });
    }
  },
});

export const sendUpgradePrompt = internalAction({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log(`[EMAIL] Sending upgrade prompt to ${args.email}`);
    console.log(`Subject: Your trial has expired - Upgrade now!`);
    console.log(
      `Body: Hi! Your 14-day trial is over. Upgrade to premium for $9.99/month.`,
    );
  },
});

export const sendRetentionOffer = internalAction({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log(`[EMAIL] Sending retention offer to ${args.email}`);
    console.log(`Subject: Special offer - 20% off for the first 3 months!`);
    console.log(`Body: We'd love to have you stay. Here's a special discount.`);
  },
});

export const processPayment = internalAction({
  args: {
    userId: v.string(),
    paymentMethodId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    transactionId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    console.log(
      `[PAYMENT] Processing payment for user ${args.userId} with method ${args.paymentMethodId}`,
    );

    const random = Math.random();
    if (random > 0.8) {
      console.log(`[PAYMENT] Payment failed (simulated failure)`);
      return {
        success: false,
        error: "Insufficient funds",
      };
    }

    const transactionId = `txn_${Date.now()}_${args.userId}`;
    console.log(
      `[PAYMENT] Payment successful, transaction ID: ${transactionId}`,
    );
    return {
      success: true,
      transactionId,
    };
  },
});

export const provisionPremiumResources = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log(
      `[PROVISIONING] Starting resource provisioning for user ${args.userId}`,
    );
    console.log(`[PROVISIONING] - Allocating database storage...`);
    console.log(`[PROVISIONING] - Setting up CDN access...`);
    console.log(`[PROVISIONING] - Configuring API rate limits...`);
    console.log(
      `[PROVISIONING] Request sent to external system, awaiting webhook confirmation`,
    );
  },
});

export const activatePremium = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      throw new Error(`Subscription not found for user ${args.userId}`);
    }

    await ctx.db.patch(subscription._id, {
      status: "active",
      tier: "premium",
      activatedAt: Date.now(),
    });

    console.log(`Premium features activated for user ${args.userId}`);
  },
});

export const downgradeToFree = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      throw new Error(`Subscription not found for user ${args.userId}`);
    }

    await ctx.db.patch(subscription._id, {
      status: "active",
      tier: "free",
      downgradedAt: Date.now(),
    });

    console.log(`User ${args.userId} downgraded to free tier`);
  },
});

export const sendConfirmationEmail = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log(`[EMAIL] Sending confirmation email to user ${args.userId}`);
    console.log(`Subject: Welcome to Premium!`);
    console.log(
      `Body: Your premium subscription is now active. Enjoy all features!`,
    );
  },
});

export const sendDowngradeNotice = internalAction({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log(`[EMAIL] Sending downgrade notice to ${args.email}`);
    console.log(`Subject: Account downgraded to free tier`);
    console.log(
      `Body: Your account has been moved to the free tier. You can upgrade anytime.`,
    );
  },
});

export const startSubscriptionWorkflow = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<WorkflowId> => {
    const trialEndDate = Date.now() + TRIAL_DURATION_MS;

    const workflowId = await workflow.start(
      ctx,
      internal.subscriptionTrial.subscriptionTrialWorkflow,
      {
        userId: args.userId,
        email: args.email,
        trialEndDate,
      },
    );

    console.log(
      `Started subscription workflow ${workflowId} for user ${args.userId}`,
    );
    return workflowId;
  },
});

export const resumeUserDecision = internalMutation({
  args: {
    workflowId: vWorkflowId,
    decision: v.union(
      v.object({ decision: v.literal("upgrade"), paymentMethodId: v.string() }),
      v.object({ decision: v.literal("decline") }),
    ),
  },
  handler: async (ctx, args) => {
    await signals?.userDecision.resolve(
      ctx,
      args.workflowId as WorkflowId,
      args.decision,
    );
  },
});

export const resumeRetentionResponse = internalMutation({
  args: {
    workflowId: vWorkflowId,
    decision: v.union(
      v.object({
        decision: v.literal("accepted"),
        paymentMethodId: v.string(),
      }),
      v.object({ decision: v.literal("declined") }),
    ),
  },
  handler: async (ctx, args) => {
    await signals?.retentionDecision.resolve(
      ctx,
      args.workflowId as WorkflowId,
      args.decision,
    );
  },
});

export const resumePaymentRetry = internalMutation({
  args: {
    workflowId: vWorkflowId,
    decision: v.union(
      v.object({ decision: v.literal("retry"), paymentMethodId: v.string() }),
      v.object({ decision: v.literal("cancel") }),
    ),
  },
  handler: async (ctx, args) => {
    await signals?.paymentRetry.resolve(
      ctx,
      args.workflowId as WorkflowId,
      args.decision,
    );
  },
});

export const getSubscription = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});
