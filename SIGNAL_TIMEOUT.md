# Signal Timeout Support

The workflow component now supports timeouts for signal awaits, preventing workflows from being blocked indefinitely when external signals are never resolved.

## Basic Usage

```typescript
import { v } from "convex/values";
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

const workflow = new WorkflowManager(components.workflow);

export const { mutation: paymentWorkflow, signals } = workflow.define({
  args: {
    orderId: v.string(),
    amount: v.number(),
  },
  
  signals: {
    paymentReceived: v.object({ 
      paymentId: v.string(),
      amount: v.number(),
    }),
  },

  async handler(ctx, args) {
    const paymentSignal = await ctx.signals.create("paymentReceived");
    
    try {
      // Wait for payment with 5-minute timeout
      const payment = await ctx.signals.awaitSignal(paymentSignal, {
        timeoutMs: 300000, // 5 minutes
      });
      
      return { success: true, paymentId: payment.paymentId };
    } catch (error) {
      if (error.message.includes("timed out")) {
        // Handle timeout
        return { success: false, reason: "Payment timeout" };
      }
      throw error;
    }
  },

  returns: v.object({
    success: v.boolean(),
    paymentId: v.optional(v.string()),
    reason: v.optional(v.string()),
  }),
});
```

## How It Works

1. **Timeout Scheduling**: When you call `awaitSignal()` with a `timeoutMs` option, a timeout handler is scheduled via the workpool.

2. **Race Condition**: The workflow waits for whichever happens first:
   - Signal is resolved/rejected externally
   - Timeout handler fires

3. **Timeout Handler**: If the timeout fires and the signal is still pending, it:
   - Marks the signal as `rejected`
   - Sets error message to `"Signal timed out after {X}ms"`
   - Completes the waiting step with the error
   - Resumes the workflow

4. **Signal Resolved First**: If the signal is resolved before timeout:
   - Workflow resumes normally with the signal value
   - Timeout handler runs but becomes a no-op (signal already completed)

## Examples

### Example 1: Simple Timeout

```typescript
async handler(ctx, args) {
  const approvalSignal = await ctx.signals.create("managerApproval");
  
  try {
    const approval = await ctx.signals.awaitSignal(approvalSignal, {
      timeoutMs: 60000, // 1 minute
    });
    
    return { approved: true, approvedBy: approval.managerId };
  } catch (error) {
    if (error.message.includes("timed out")) {
      return { approved: false, reason: "Approval timeout" };
    }
    throw error;
  }
}
```

### Example 2: Retry Logic with Timeout

```typescript
async handler(ctx, args) {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const paymentSignal = await ctx.signals.create(`payment-attempt-${attempt}`);
    
    try {
      const payment = await ctx.signals.awaitSignal(paymentSignal, {
        timeoutMs: 300000, // 5 minutes per attempt
      });
      
      return { success: true, paymentId: payment.paymentId, attempts: attempt + 1 };
    } catch (error) {
      if (error.message.includes("timed out")) {
        console.log(`Payment attempt ${attempt + 1} timed out`);
        
        if (attempt === maxRetries - 1) {
          // Final attempt failed
          return { 
            success: false, 
            reason: `All ${maxRetries} payment attempts timed out` 
          };
        }
        
        // Retry
        continue;
      }
      throw error;
    }
  }
}
```

### Example 3: Different Timeouts for Different Signals

```typescript
async handler(ctx, args) {
  // Quick approval timeout
  const approvalSignal = await ctx.signals.create("managerApproval");
  const approval = await ctx.signals.awaitSignal(approvalSignal, {
    timeoutMs: 60000, // 1 minute
  });
  
  if (!approval.approved) {
    return { success: false, reason: "Not approved" };
  }
  
  // Longer processing timeout
  const processingSignal = await ctx.signals.create("processingComplete");
  const result = await ctx.signals.awaitSignal(processingSignal, {
    timeoutMs: 3600000, // 1 hour
  });
  
  return { success: true, result };
}
```

### Example 4: Graceful Degradation

```typescript
async handler(ctx, args) {
  const enrichmentSignal = await ctx.signals.create("dataEnrichment");
  
  let enrichedData = null;
  try {
    enrichedData = await ctx.signals.awaitSignal(enrichmentSignal, {
      timeoutMs: 10000, // 10 seconds
    });
  } catch (error) {
    if (error.message.includes("timed out")) {
      console.log("Data enrichment timed out, proceeding without enrichment");
      // Continue without enriched data
    } else {
      throw error;
    }
  }
  
  return {
    data: args.originalData,
    enrichedData: enrichedData || null,
    wasEnriched: enrichedData !== null,
  };
}
```

## Error Handling

When a signal times out, the `awaitSignal()` call throws an error with a message like:

```
Signal timed out after 5000ms
```

You can catch this error and handle it appropriately:

```typescript
try {
  await ctx.signals.awaitSignal(signal, { timeoutMs: 5000 });
} catch (error) {
  if (error.message.includes("timed out")) {
    // Handle timeout
  } else if (error.message.includes("rejected")) {
    // Handle explicit rejection
  } else {
    // Handle other errors
    throw error;
  }
}
```

## Best Practices

1. **Choose Appropriate Timeouts**: 
   - User interactions: 1-5 minutes
   - API calls: 30 seconds - 2 minutes
   - Long-running processes: 10-60 minutes

2. **Always Handle Timeouts**: Use try-catch to handle timeout errors gracefully

3. **Log Timeout Events**: Help with debugging and monitoring:
   ```typescript
   catch (error) {
     if (error.message.includes("timed out")) {
       console.error(`Signal ${signalName} timed out`, { orderId: args.orderId });
     }
   }
   ```

4. **Consider Retry Logic**: For transient failures, implement retries with backoff

5. **Provide Fallback Behavior**: Design workflows to continue even if optional signals timeout

6. **Monitor Timeout Rates**: High timeout rates may indicate:
   - Timeout values are too short
   - External systems are slow/failing
   - Workflow design issues

## API Reference

### `ctx.signals.awaitSignal(handle, options?)`

Wait for a signal to be resolved or rejected.

**Parameters:**
- `handle`: `SignalHandle<T>` - The signal handle returned from `create()`
- `options` (optional):
  - `timeoutMs`: `number` - Timeout in milliseconds

**Returns:** `Promise<T>` - The signal value

**Throws:** Error if signal is rejected or times out

**Example:**
```typescript
const payment = await ctx.signals.awaitSignal(paymentSignal, {
  timeoutMs: 300000, // 5 minutes
});
```

## Implementation Details

### Database Schema

Signal steps now include optional timeout fields:

```typescript
{
  type: "signal",
  signalId: Id<"signals">,
  timeoutMs?: number,           // Timeout duration in milliseconds
  timeoutScheduledAt?: number,  // Timestamp when timeout was scheduled
  // ... other fields
}
```

### Timeout Scheduling

When a signal step is started with `timeoutMs`:

1. A timeout mutation is scheduled via workpool:
   ```typescript
   await workpool.enqueueMutation(
     ctx,
     internal.signals.handleTimeout,
     { stepId, signalId },
     {
       name: `timeout:${step.name}`,
       runAfter: step.timeoutMs,  // Delay execution
     }
   );
   ```

2. The `timeoutScheduledAt` timestamp is recorded for debugging

### Race Condition Handling

The implementation handles concurrent signal resolution and timeout:

- **Signal resolved first**: Timeout handler checks if signal is still pending, becomes no-op
- **Timeout fires first**: Signal is marked as rejected, workflow resumes with error
- **Concurrent**: Database state check determines winner (first to change state from "pending")

## Migration

The timeout feature is **100% backward compatible**:

- Existing workflows continue to work without timeouts
- The `timeoutMs` parameter is optional
- No database migration required (fields are optional)

## Related Features

- **Signal Cancellation** (Planned): Explicitly cancel pending signals
- **Signal Race/All** (Planned): Wait for multiple signals concurrently
- **Signal Metadata Updates** (Planned): Track progress without resolving

## See Also

- [Workflow Signals Debugging Story](../../docs/workflow-signals-debugging-story.md)
- [Signal Resolution Guide](../../docs/signal-resolution-guide.md)
