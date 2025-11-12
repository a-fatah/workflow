## Signal Timeout Implementation Analysis

Based on my review of the workflow component implementation, here's my analysis and recommendations for implementing signal timeout functionality:

### Current Architecture Understanding

1. **Signal Lifecycle**: Signals are created → awaited → resolved/rejected
2. **Blocking Mechanism**: When `awaitSignal()` is called, it creates a signal step that remains `inProgress: true` until the signal is resolved
3. **Resume Mechanism**: Signal resolution sets `waitingStepId` to link back to the waiting step, completes the step, and re-enqueues the workflow

### Proposed API Design Options

#### **Option 1: Timeout in `awaitSignal()` (Recommended)**
```typescript
// Workflow code
const payment = await ctx.signals.awaitSignal(paymentSignal, {
  timeoutMs: 300000, // 5 minutes
});
```

**Pros:**
- Clean, intuitive API - timeout is specified where the wait happens
- Explicit at call site - workflow authors see timeout clearly
- Mirrors `Promise.race()` pattern that developers know
- Can have different timeouts for different signal awaits

**Cons:**
- None significant

#### **Option 2: Timeout in Signal Creation**
```typescript
// Workflow code
const paymentSignal = await ctx.signals.create("paymentReceived", {
  timeoutMs: 300000,
});
```

**Pros:**
- Centralizes timeout configuration with signal definition

**Cons:**
- Less flexible - signal might be awaited in different contexts with different timeout needs
- Timeout is far from where blocking happens
- Less intuitive for workflow authors

#### **Option 3: Separate Timeout API**
```typescript
// Workflow code
const payment = await ctx.signals.awaitSignal(
  paymentSignal,
  ctx.signals.timeout(300000)
);
```

**Cons:**
- Overly complex API surface
- No real benefit over Option 1

### Implementation Strategy (Option 1)

#### 1. **API Surface Changes**

```typescript
// stepContext.ts:19
export interface WorkflowSignalHelpers<SignalsValidator extends PropertyValidators = {}> {
  awaitSignal: <Returns>(
    handle: SignalHandle<Returns>,
    options?: { timeoutMs?: number }
  ) => Promise<Returns>;
  // ... other methods
}
```

#### 2. **Database Schema Changes**

```typescript
// schema.ts:89 - Add timeout to signalStep
const signalStep = v.object({
  ...baseStepFields,
  type: v.literal("signal"),
  signalId: v.id("signals"),
  argsSize: v.number(),
  args: v.any(),
  timeoutMs: v.optional(v.number()),        // NEW
  timeoutScheduledAt: v.optional(v.number()), // NEW - when timeout was scheduled
});
```

#### 3. **Step Creation Logic**

```typescript
// stepContext.ts:109 - Update runSignalAwait
private async runSignalAwait<T>(
  handle: SignalHandle<T>,
  options?: { timeoutMs?: number }
): Promise<T> {
  let send: unknown;
  const p = new Promise<T>((resolve, reject) => {
    send = this.sender.push({
      type: "signal" as const,
      name: handle.name,
      signalHandle: handle,
      args: { signalId: handle.signalId },
      timeoutMs: options?.timeoutMs,  // NEW
      resolve: resolve as (result: unknown) => void,
      reject,
    });
  });
  void send;
  return p;
}
```

#### 4. **Timeout Scheduling in Journal**

```typescript
// journal.ts:147 - Update signal step handling
} else if (step.type === "signal") {
  // Update signal with waiting step ID
  const signal = await ctx.db.get(step.signalId);
  if (signal && signal.state === "pending") {
    signal.waitingStepId = stepId;
    await ctx.db.replace(step.signalId, signal);
  }
  
  // NEW: Schedule timeout if specified
  if (step.timeoutMs) {
    await workpool.enqueueMutation(
      ctx,
      internal.signals.handleTimeout as FunctionHandle<"mutation">,
      { stepId, signalId: step.signalId },
      {
        name: `timeout:${step.name}`,
        runAfter: step.timeoutMs,
        onComplete: internal.pool.onComplete,
        context: { generationNumber, stepId },
      }
    );
    entry.step.timeoutScheduledAt = Date.now();
    await ctx.db.replace(entry._id, entry);
  }
}
```

#### 5. **Timeout Handler**

```typescript
// signals.ts - NEW mutation
export const handleTimeout = mutation({
  args: {
    stepId: v.id("steps"),
    signalId: v.id("signals"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    
    // Only timeout if signal is still pending
    if (!signal || signal.state !== "pending") {
      return;
    }
    
    const step = await ctx.db.get(args.stepId);
    if (!step || !step.step.inProgress) {
      return;
    }
    
    // Mark signal as rejected due to timeout
    signal.state = "rejected";
    signal.error = `Signal timed out after ${step.step.timeoutMs}ms`;
    signal.completedAt = Date.now();
    
    const hadWaitingStep = await completeWaitingStep(
      ctx,
      signal.waitingStepId,
      {
        kind: "failed",
        error: signal.error,
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
```

#### 6. **Race Condition Handling**

The implementation must handle:
- **Signal resolved before timeout**: Timeout mutation runs but signal is already fulfilled - no-op
- **Timeout fires before signal resolved**: Signal is rejected, workflow resumes with error
- **Concurrent resolution and timeout**: First one wins (database state determines winner)

### Additional Signal-Related Features to Consider

#### 1. **Signal Cancellation**
```typescript
await ctx.signals.cancel(signalHandle, "User cancelled operation");
```
- Useful for cleanup when workflow is cancelled
- Prevents dangling signals in database

#### 2. **Signal Status Query** (Already exists via `load()`)
```typescript
const status = await ctx.signals.load(signalHandle);
// status.state: "pending" | "fulfilled" | "rejected"
```

#### 3. **Signal Metadata Updates**
```typescript
await ctx.signals.updateMetadata(signalHandle, { 
  lastCheckedAt: Date.now(),
  attemptCount: 3 
});
```
- Track progress without resolving signal
- Useful for long-running external processes

#### 4. **Conditional Signal Resolution** (Idempotency)
Already implemented! `resolve()` checks `signal.state !== "pending"`

#### 5. **Signal History/Audit Trail**
- Track all state transitions
- Useful for debugging and compliance
- Could be separate table: `signal_history`

#### 6. **Bulk Signal Operations**
```typescript
await ctx.signals.resolveAll(signalHandles, values);
await ctx.signals.timeoutAll(workflowId);
```
- Useful for workflow cleanup
- Batch operations for efficiency

### Type-Safe Error Handling

```typescript
// Workflow code
try {
  const payment = await ctx.signals.awaitSignal(paymentSignal, {
    timeoutMs: 300000,
  });
  // Handle success
} catch (error) {
  if (error.message.includes("timed out")) {
    // Handle timeout specifically
    return { success: false, reason: "Payment timeout" };
  }
  throw error;
}
```

### Recommendation

**Implement Option 1** with the following priorities:

1. ✅ **High Priority**: Timeout in `awaitSignal()` - Critical for production workflows
2. ⚠️ **Medium Priority**: Signal cancellation - Nice for cleanup
3. 🔵 **Low Priority**: Metadata updates, bulk operations - Can add later as needed

The timeout implementation is clean, follows existing patterns (like `pause` and `runAction` with retry), and provides workflow authors with fine-grained control over timeout behavior without overwhelming complexity.