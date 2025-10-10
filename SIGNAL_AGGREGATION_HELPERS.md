# Signal Aggregation Helpers (`all`, `race`, `any`)

The workflow component provides three powerful helpers for coordinating multiple signals concurrently: `signals.all()`, `signals.race()`, and `signals.any()`. These helpers enable complex coordination patterns while maintaining workflow replay guarantees.

## Overview

| Helper | Purpose | Completes When | Returns |
|--------|---------|----------------|---------|
| `all()` | Wait for all signals | All signals fulfill | Object with all values |
| `race()` | First to complete wins | First signal settles | Winner key and value |
| `any()` | Wait for N successes | N signals fulfill | Array of resolved signals |

**Key Features:**
- ✅ Automatic cancellation of losing/remaining signals
- ✅ Proper timeout work cleanup
- ✅ Explicit feedback to external systems
- ✅ Deterministic replay behavior
- ✅ Type-safe results

## `ctx.signals.all()`

Wait for all signals to complete successfully. **Fails fast** on first rejection.

### API

```typescript
const result = await ctx.signals.all({
  payment: paymentSignal,
  shipping: shippingSignal,
  inventory: inventorySignal,
});

// result: { payment: T1, shipping: T2, inventory: T3 }
```

### Behavior

- ✅ Waits for **all** signals to fulfill
- ❌ **First rejection cancels all others** and fails immediately (fail-fast)
- 🔄 Cancels pending signals with reason: `"Signal group failed: {failed_signal_name} rejected"`
- 🎯 Returns object with values keyed by your input keys

### Example: Order Processing

```typescript
export const { mutation: orderWorkflow, signals } = workflow.define({
  args: { orderId: v.string() },
  signals: {
    payment: v.object({ transactionId: v.string(), amount: v.number() }),
    inventory: v.object({ reserved: v.boolean(), warehouseId: v.string() }),
    shipping: v.object({ carrier: v.string(), trackingNumber: v.string() }),
  },

  async handler(ctx, args) {
    const paymentSignal = await ctx.signals.create("payment");
    const inventorySignal = await ctx.signals.create("inventory");
    const shippingSignal = await ctx.signals.create("shipping");

    try {
      // Wait for all three signals
      const results = await ctx.signals.all({
        payment: paymentSignal,
        inventory: inventorySignal,
        shipping: shippingSignal,
      });

      console.log(`Order ${args.orderId} ready to ship`);
      return {
        success: true,
        transactionId: results.payment.transactionId,
        warehouseId: results.inventory.warehouseId,
        trackingNumber: results.shipping.trackingNumber,
      };
    } catch (error) {
      // One signal was rejected - all others were automatically cancelled
      console.error(`Order ${args.orderId} failed:`, error.message);
      return { success: false, error: error.message };
    }
  },

  returns: v.union(
    v.object({
      success: v.literal(true),
      transactionId: v.string(),
      warehouseId: v.string(),
      trackingNumber: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
});
```

### Cancellation Example

```typescript
// If inventory check fails...
await signals.inventory.reject(ctx, inventorySignalId, "Out of stock");

// Then automatically:
// 1. Payment and shipping signals are cancelled
// 2. Their timeout work is cancelled
// 3. External systems get errors when they try to resolve cancelled signals
// 4. Workflow fails with "Out of stock" error
```

## `ctx.signals.race()`

First signal to complete (resolve or reject) wins. All other signals are cancelled.

### API

```typescript
const result = await ctx.signals.race({
  email: emailSignal,
  sms: smsSignal,
  push: pushSignal,
}, { timeoutMs?: 30000 });

// result: { winnerKey: "email", value: T }
```

### Behavior

- 🏁 **First to complete wins** (resolve or reject)
- 🔄 Immediately cancels all other pending signals
- 🔄 Cancels with reason: `"Lost race to '{winner_key}'"`
- ⏱️ Optional timeout cancels all signals if none complete in time
- 🎯 Returns `{ winnerKey, value }` with winner info
- 🎲 Tie-breaker: If multiple complete simultaneously, uses deterministic ordering (signal creation time)

### Example: Multi-Channel Notification

```typescript
export const { mutation: notificationWorkflow, signals } = workflow.define({
  args: { userId: v.string(), message: v.string() },
  signals: {
    emailDelivered: v.object({ channel: v.string(), deliveredAt: v.number() }),
    smsDelivered: v.object({ channel: v.string(), deliveredAt: v.number() }),
    pushDelivered: v.object({ channel: v.string(), deliveredAt: v.number() }),
  },

  async handler(ctx, args) {
    // Create signals for all notification channels
    const emailSignal = await ctx.signals.create("emailDelivered");
    const smsSignal = await ctx.signals.create("smsDelivered");
    const pushSignal = await ctx.signals.create("pushDelivered");

    try {
      // Race: first channel to deliver wins
      const { winnerKey, value } = await ctx.signals.race({
        email: emailSignal,
        sms: smsSignal,
        push: pushSignal,
      }, {
        timeoutMs: 60000, // 1 minute timeout
      });

      console.log(`Notification delivered via ${winnerKey}`);
      return {
        success: true,
        channel: value.channel,
        deliveredAt: value.deliveredAt,
      };
    } catch (error) {
      // All channels failed or timed out
      console.error("Notification delivery failed:", error.message);
      return { success: false, error: error.message };
    }
  },

  returns: v.union(
    v.object({
      success: v.literal(true),
      channel: v.string(),
      deliveredAt: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
});
```

### External System Handling

```typescript
// When email delivers first...
await signals.emailDelivered.resolve(ctx, emailSignalId, {
  channel: "email",
  deliveredAt: Date.now(),
});

// Then automatically:
// 1. SMS and push signals are cancelled
// 2. Their timeout work is cancelled
// 3. Workflow resumes with email as winner

// Later, when SMS tries to deliver...
try {
  await signals.smsDelivered.resolve(ctx, smsSignalId, { ... });
} catch (error) {
  // Error: "Signal already completed: {signalId}"
  // External system knows it lost and can log/cleanup
  console.log("SMS delivery was too slow, email already won");
}
```

## `ctx.signals.any()`

Wait for at least N signals to succeed. Ignores rejections until threshold cannot be met.

### API

```typescript
const result = await ctx.signals.any({
  complianceCheck: complianceSignal,
  riskAssessment: riskSignal,
  manualReview: reviewSignal,
}, {
  min: 2,           // Default: 1
  timeoutMs: 60000  // Optional timeout
});

// result: { resolved: [{ key: "compliance", value: T1 }, { key: "risk", value: T2 }] }
```

### Behavior

- ✅ Waits for **at least N** signals to fulfill (default: 1)
- ⚠️ Ignores rejections as long as threshold can still be met
- 🔄 Cancels remaining signals once threshold is met
- 🔄 Cancels with reason: `"Sufficient signals resolved (N of M)"`
- ❌ Fails if threshold cannot be met (too many rejections)
- 🎯 Returns `{ resolved: [{ key, value }] }` array

### Example: Multi-Provider API

```typescript
export const { mutation: dataEnrichmentWorkflow, signals } = workflow.define({
  args: { userId: v.string() },
  signals: {
    provider1: v.object({ data: v.any(), confidence: v.number() }),
    provider2: v.object({ data: v.any(), confidence: v.number() }),
    provider3: v.object({ data: v.any(), confidence: v.number() }),
  },

  async handler(ctx, args) {
    const provider1Signal = await ctx.signals.create("provider1");
    const provider2Signal = await ctx.signals.create("provider2");
    const provider3Signal = await ctx.signals.create("provider3");

    try {
      // Wait for at least 2 providers to succeed
      const { resolved } = await ctx.signals.any({
        provider1: provider1Signal,
        provider2: provider2Signal,
        provider3: provider3Signal,
      }, {
        min: 2,
        timeoutMs: 30000, // 30 seconds
      });

      // Combine data from successful providers
      const combinedData = resolved.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value,
      }), {});

      console.log(`Enrichment completed with ${resolved.length} providers`);
      return {
        success: true,
        providers: resolved.map(r => r.key),
        data: combinedData,
      };
    } catch (error) {
      console.error("Enrichment failed:", error.message);
      return { success: false, error: error.message };
    }
  },

  returns: v.union(
    v.object({
      success: v.literal(true),
      providers: v.array(v.string()),
      data: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
});
```

### Threshold Logic

```typescript
// With min: 2 and 3 signals:
// - If 2 succeed → workflow continues, 3rd signal cancelled
// - If 1 succeeds, 1 rejects → wait for 3rd (can still meet threshold)
// - If 2 reject → fail immediately (threshold cannot be met)

// Example sequence:
const { resolved } = await ctx.signals.any({
  a: signalA,
  b: signalB,
  c: signalC,
}, { min: 2 });

// Time 0: a succeeds (1/2 met, keep waiting)
// Time 1: b succeeds (2/2 met, cancel c, return immediately)
// Time 2: c tries to resolve but gets error "Signal already completed"
```

## Advanced Examples

### Race with Fallback

```typescript
async handler(ctx, args) {
  const primarySignal = await ctx.signals.create("primaryAPI");
  const fallbackSignal = await ctx.signals.create("fallbackAPI");

  try {
    const { winnerKey, value } = await ctx.signals.race({
      primary: primarySignal,
      fallback: fallbackSignal,
    }, {
      timeoutMs: 5000, // 5 second timeout
    });

    return { source: winnerKey, data: value };
  } catch (error) {
    // Both failed or timed out
    return { source: "cache", data: await getCachedData(args) };
  }
}
```

### Any with Dynamic Minimum

```typescript
async handler(ctx, args) {
  const signals = {
    quick: await ctx.signals.create("quickCheck"),
    standard: await ctx.signals.create("standardCheck"),
    thorough: await ctx.signals.create("thoroughCheck"),
  };

  // Adjust minimum based on priority
  const minRequired = args.priority === "high" ? 3 : 2;

  const { resolved } = await ctx.signals.any(signals, {
    min: minRequired,
    timeoutMs: args.priority === "high" ? 60000 : 30000,
  });

  return {
    checksCompleted: resolved.length,
    results: resolved.map(r => r.value),
  };
}
```

### All with Individual Timeouts

```typescript
async handler(ctx, args) {
  // Create signals with different timeouts
  const paymentSignal = await ctx.signals.create("payment");
  const inventorySignal = await ctx.signals.create("inventory");

  // Start individual timeouts by awaiting separately, then use all()
  // Note: This pattern is not recommended - use signals.all() directly
  
  // Better approach: signals.all() applies single group timeout
  const results = await ctx.signals.all({
    payment: paymentSignal,
    inventory: inventorySignal,
  });

  return results;
}
```

## Cancellation & Cleanup

All helpers automatically perform cleanup when signals are cancelled:

### What Gets Cancelled

1. **Signal state** → Changed to `"cancelled"`
2. **Timeout work** → Scheduled timeout mutations are cancelled
3. **Waiting step** → Marked as no longer in progress
4. **External feedback** → Resolve/reject attempts get explicit errors

### Cancellation Reasons

| Helper | Reason Template |
|--------|----------------|
| `all()` | `"Signal group failed: {failed_signal_name} rejected"` |
| `race()` | `"Lost race to '{winner_key}'"` |
| `any()` | `"Sufficient signals resolved (N of M)"` |

### Example: External System Response

```typescript
// In your webhook handler:
export const handleWebhook = mutation({
  args: { signalId: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    try {
      await signals.mySignal.resolve(ctx, args.signalId, args.data);
      console.log("Signal resolved successfully");
    } catch (error) {
      if (error.message.includes("already completed")) {
        // Signal was cancelled - this system lost the race
        console.log("Signal was already resolved/cancelled, ignoring");
        // Optionally: log metrics, cleanup resources, etc.
      } else {
        throw error;
      }
    }
  },
});
```

## Error Handling

### Common Error Patterns

```typescript
try {
  const result = await ctx.signals.race({ a: signalA, b: signalB });
} catch (error) {
  if (error.message.includes("timed out")) {
    // All signals timed out
    console.log("Race timed out, no signals completed");
  } else if (error.message.includes("rejected")) {
    // Winner was a rejection
    console.log("Race won by rejected signal:", error.message);
  } else {
    throw error;
  }
}
```

```typescript
try {
  const result = await ctx.signals.any(signals, { min: 3 });
} catch (error) {
  if (error.message.includes("Cannot meet minimum threshold")) {
    // Too many rejections, can't reach min
    console.log("Too many providers failed");
  } else {
    throw error;
  }
}
```

## Best Practices

### 1. Choose the Right Helper

- **Use `all()`** when all inputs are required for correctness
- **Use `race()`** when any result is acceptable (redundancy, fallback)
- **Use `any()`** when you need consensus or partial success

### 2. Set Appropriate Timeouts

```typescript
// Quick user interactions
await ctx.signals.race(signals, { timeoutMs: 5000 });

// External API calls
await ctx.signals.any(signals, { min: 2, timeoutMs: 30000 });

// Long-running processes (no timeout for all())
await ctx.signals.all(signals);
```

### 3. Handle External System Responses

```typescript
// Always check for cancellation errors
try {
  await signals.mySignal.resolve(ctx, signalId, value);
} catch (error) {
  if (error.message.includes("already completed")) {
    // Log for observability
    logger.info("Signal resolution ignored", { signalId, reason: "cancelled" });
  } else {
    throw error;
  }
}
```

### 4. Provide Meaningful Signal Names

```typescript
// Good: Descriptive keys that explain purpose
const result = await ctx.signals.race({
  stripePayment: stripeSignal,
  paypalPayment: paypalSignal,
});
console.log(`Payment via ${result.winnerKey} succeeded`);

// Bad: Generic keys
const result = await ctx.signals.race({
  a: signal1,
  b: signal2,
});
```

### 5. Monitor Cancellation Rates

```typescript
// Track which signals are frequently cancelled
console.event("signalCancelled", {
  helperType: "race",
  signalName: signal.name,
  reason: signal.cancelReason,
});
```

## Type Safety

All helpers maintain full TypeScript type inference:

```typescript
const signals = {
  payment: paymentSignal,    // SignalHandle<{ amount: number }>
  shipping: shippingSignal,  // SignalHandle<{ carrier: string }>
};

const result = await ctx.signals.all(signals);
// result: { payment: { amount: number }, shipping: { carrier: string } }

const raceResult = await ctx.signals.race(signals);
// raceResult: { winnerKey: "payment" | "shipping", value: { amount: number } | { carrier: string } }

const anyResult = await ctx.signals.any(signals, { min: 1 });
// anyResult: { resolved: Array<{ key: "payment" | "shipping", value: ... }> }
```

## Performance Considerations

### Database Queries

Each helper performs O(1) queries per signal completion:
- 1 query to fetch the completing signal
- 1 query to fetch group members
- N updates to cancel remaining signals

### Timeout Work

Cancelled signals automatically cancel their timeout work, preventing unnecessary scheduled mutations from executing.

### Replay Behavior

All helpers are replay-safe:
- Results are cached in the step entry
- Replaying a completed helper returns cached results instantly
- No duplicate cancellations on replay

## Migration from Manual Patterns

### Before: Manual Race

```typescript
// Old pattern: Manual coordination
const signals = await Promise.race([
  ctx.signals.awaitSignal(signal1),
  ctx.signals.awaitSignal(signal2),
]);
// Problem: Other signals not cancelled, timeouts not cleaned up
```

### After: Helper Race

```typescript
// New pattern: Automatic cleanup
const { winnerKey, value } = await ctx.signals.race({
  option1: signal1,
  option2: signal2,
});
// Benefit: Losers cancelled, timeouts cleaned up, winner tracked
```

## Related Features

- **[Signal Timeouts](./SIGNAL_TIMEOUT.md)**: Individual signal timeout support
- **[Pause/Resume](./PAUSE_RESUME_EXAMPLE.md)**: Workflow suspension patterns
- **Signal Cancellation**: Explicitly cancel signals via `ctx.signals.cancel()`

## Implementation Details

### Schema Extensions

Grouped signals include metadata:

```typescript
{
  helperType: "race" | "any" | "all",
  groupId: string,              // Unique group identifier
  signalKeyMap: Record<string, string>, // signalId -> user key
  groupMembers: Id<"signals">[],        // All signal IDs in group
  winnerKey?: string,                    // For race: winning key
  completedKeys?: string[],              // For any: fulfilled keys
  minRequired?: number,                  // For any: threshold
}
```

### Deterministic Replay

Helpers ensure deterministic behavior:
- Tie-breaking uses signal creation time
- Cached results prevent re-execution on replay
- Cancellation idempotency prevents duplicate work

## Troubleshooting

### "Signal already completed" Errors

**Cause**: External system tried to resolve a cancelled signal

**Solution**: Check for cancellation in webhook handlers

```typescript
if (error.message.includes("already completed")) {
  // This is expected - signal was cancelled by helper
  return { acknowledged: true };
}
```

### Race Always Times Out

**Cause**: All signals fail before timeout

**Solution**: Check signal resolution logic, increase timeout

```typescript
const { winnerKey, value } = await ctx.signals.race(signals, {
  timeoutMs: 60000, // Increase if needed
});
```

### Any Never Completes

**Cause**: Threshold set too high or signals failing

**Solution**: Lower `min` threshold or handle rejections

```typescript
const { resolved } = await ctx.signals.any(signals, {
  min: Math.min(2, Object.keys(signals).length), // Dynamic minimum
});
```

## See Also

- [Signal Timeout Documentation](./SIGNAL_TIMEOUT.md)
- [Workflow Signals Debugging Story](../../docs/workflow-signals-debugging-story.md)
- [Signal Resolution Guide](../../docs/signal-resolution-guide.md)
