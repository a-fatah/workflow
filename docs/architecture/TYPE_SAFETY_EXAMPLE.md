# Compile-Time Type Safety for Pause/Resume

## Overview

The pause/resume implementation now provides **full compile-time type safety** using TypeScript's type inference with Convex validators.

## How It Works

When you provide a `returns` validator to `workflow.resume()`, TypeScript will:

1. Infer the expected type from the validator
2. Type-check the `resumeValue` parameter at compile time
3. Show errors if the value doesn't match the expected type

## Type-Safe Resume (Recommended)

### ✅ Correct Usage

```typescript
import { v } from "convex/values";
import { workflow } from "./example";

// Define the validator (can be shared between pause and resume)
const approvalValidator = v.object({
  approved: v.boolean(),
  approver: v.string(),
  timestamp: v.number(),
});

export const approveWorkflow = internalMutation({
  args: {
    workflowId: vWorkflowId,
    approved: v.boolean(),
    approver: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ Type-safe: resumeValue is typed as { approved: boolean, approver: string, timestamp: number }
    await workflow.resume(
      ctx,
      internal.workflows.orderWorkflow,
      args.workflowId,
      {
        approved: args.approved,
        approver: args.approver,
        timestamp: Date.now(),
      },
      {
        returns: approvalValidator, // TypeScript infers the type from this!
        name: "waitForApproval",
      },
    );
  },
});
```

### ❌ Compile-Time Errors

TypeScript will catch type errors at compile time:

```typescript
// ❌ ERROR: Type 'string' is not assignable to type 'boolean'
await workflow.resume(
  ctx,
  internal.workflows.orderWorkflow,
  workflowId,
  {
    approved: "yes", // ❌ Should be boolean, not string!
    approver: "John",
    timestamp: Date.now(),
  },
  {
    returns: approvalValidator,
  },
);

// ❌ ERROR: Property 'timestamp' is missing
await workflow.resume(
  ctx,
  internal.workflows.orderWorkflow,
  workflowId,
  {
    approved: true,
    approver: "John",
    // ❌ Missing 'timestamp' property!
  },
  {
    returns: approvalValidator,
  },
);

// ❌ ERROR: Object literal may only specify known properties
await workflow.resume(
  ctx,
  internal.workflows.orderWorkflow,
  workflowId,
  {
    approved: true,
    approver: "John",
    timestamp: Date.now(),
    extraField: "oops", // ❌ Extra field not in validator!
  },
  {
    returns: approvalValidator,
  },
);
```

## Without Type Checking (Fallback)

If you don't provide a `returns` validator, the value is typed as `unknown`:

```typescript
// No compile-time type checking
await workflow.resume(
  ctx,
  internal.workflows.orderWorkflow,
  workflowId,
  anyValue, // Typed as `unknown`
  {
    name: "waitForApproval",
  },
);
```

## Function Overloads

The `resume` method has two overloads:

```typescript
// Overload 1: Type-safe with validator (recommended)
async resume<F, V extends Validator<any, "optional", any>>(
  ctx: RunMutationCtx,
  workflow: F,
  workflowId: WorkflowId,
  resumeValue: Infer<V>, // ✅ Type is inferred from validator!
  opts: {
    returns: V; // Required for type inference
    name?: string;
  }
): Promise<void>;

// Overload 2: Without type checking (fallback)
async resume<F>(
  ctx: RunMutationCtx,
  workflow: F,
  workflowId: WorkflowId,
  resumeValue: unknown, // No type checking
  opts?: {
    name?: string;
  }
): Promise<void>;
```

## Best Practices

### 1. Extract Validators to Constants

Share validators between pause and resume for consistency:

```typescript
// validators.ts
import { v } from "convex/values";

export const approvalValidator = v.object({
  approved: v.boolean(),
  approver: v.string(),
  timestamp: v.number(),
});

export const paymentValidator = v.object({
  paymentId: v.string(),
  status: v.literal("completed"),
  amount: v.number(),
});

export const shippingValidator = v.object({
  trackingNumber: v.string(),
  carrier: v.string(),
  estimatedDelivery: v.number(),
});
```

### 2. Use in Workflow

```typescript
import { approvalValidator, paymentValidator } from "./validators";

export const orderWorkflow = workflow.define({
  handler: async (step, args) => {
    // Pause with validator
    const approval = await step.pause({
      name: "waitForApproval",
      returns: approvalValidator,
    });
    // TypeScript knows: approval is { approved: boolean, approver: string, timestamp: number }

    const payment = await step.pause({
      name: "waitForPayment",
      onPause: internal.payments.createPending,
      args: { orderId: args.orderId },
      returns: paymentValidator,
    });
    // TypeScript knows: payment is { paymentId: string, status: "completed", amount: number }

    // ... rest of workflow
  },
});
```

### 3. Type-Safe Resume

```typescript
import { approvalValidator, paymentValidator } from "./validators";

export const handleApproval = internalMutation({
  args: {
    workflowId: vWorkflowId,
    approved: v.boolean(),
    approver: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ Full type safety
    await workflow.resume(
      ctx,
      internal.workflows.orderWorkflow,
      args.workflowId,
      {
        approved: args.approved,
        approver: args.approver,
        timestamp: Date.now(),
      },
      {
        returns: approvalValidator, // TypeScript enforces the shape!
        name: "waitForApproval",
      },
    );
  },
});

export const handlePayment = internalMutation({
  args: {
    workflowId: vWorkflowId,
    paymentId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // ✅ Full type safety
    await workflow.resume(
      ctx,
      internal.workflows.orderWorkflow,
      args.workflowId,
      {
        paymentId: args.paymentId,
        status: "completed" as const, // TypeScript enforces literal type
        amount: args.amount,
      },
      {
        returns: paymentValidator,
        name: "waitForPayment",
      },
    );
  },
});
```

## Type Inference in Action

```typescript
const validator = v.object({
  name: v.string(),
  age: v.number(),
  active: v.boolean(),
});

// TypeScript infers the type automatically
await workflow.resume(ctx, workflow, workflowId, resumeValue, {
  returns: validator,
});
// resumeValue is type-checked as: { name: string; age: number; active: boolean }

// Hover over 'resumeValue' in your IDE and you'll see:
// resumeValue: { name: string; age: number; active: boolean }
```

## Complex Validators

The type system works with complex nested validators:

```typescript
const complexValidator = v.object({
  user: v.object({
    id: v.string(),
    email: v.string(),
    roles: v.array(v.string()),
  }),
  metadata: v.object({
    createdAt: v.number(),
    updatedAt: v.number(),
    tags: v.array(v.string()),
  }),
  settings: v.optional(
    v.object({
      notifications: v.boolean(),
      theme: v.union(v.literal("light"), v.literal("dark")),
    }),
  ),
});

// ✅ Full type safety with nested objects, arrays, optionals, and unions!
await workflow.resume(ctx, workflow, workflowId, value, {
  returns: complexValidator,
});
```

## Benefits

1. **Catch errors at compile time** - No more runtime surprises from type mismatches
2. **IDE autocomplete** - Your editor knows the exact shape of the resume value
3. **Refactoring safety** - Change the validator, and TypeScript shows all places that need updating
4. **Self-documenting code** - The types clearly show what data is expected
5. **Runtime validation** - Still validates at runtime for extra safety

## Migration Guide

### Before (No Type Safety)

```typescript
await workflow.resume(ctx, workflow, workflowId, {
  approved: "yes", // Oops, should be boolean!
});
```

### After (Type-Safe)

```typescript
await workflow.resume(
  ctx,
  workflow,
  workflowId,
  {
    approved: true, // ✅ TypeScript enforces boolean
  },
  {
    returns: v.object({ approved: v.boolean() }),
  },
);
```

## Summary

The type-safe pause/resume implementation provides:

- ✅ **Compile-time type checking** using TypeScript's `Infer` type
- ✅ **Runtime validation** for extra safety
- ✅ **IDE autocomplete** and intellisense
- ✅ **Function overloads** for both type-safe and fallback usage
- ✅ **Works with complex nested validators**
- ✅ **Backwards compatible** - can still use without validators

This makes pause/resume as type-safe as regular function calls in Convex!
