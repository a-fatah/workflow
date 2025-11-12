import { BaseChannel } from "async-channel";
import { createFunctionHandle, } from "convex/server";
import { convexToJson } from "convex/values";
import { journalEntrySize, valueSize, } from "../component/schema.js";
const MAX_JOURNAL_SIZE = 8 << 20;
export class StepExecutor {
    workflowId;
    generationNumber;
    ctx;
    component;
    journalEntries;
    receiver;
    now;
    workpoolOptions;
    journalEntrySize;
    constructor(workflowId, generationNumber, ctx, component, journalEntries, receiver, now, workpoolOptions) {
        this.workflowId = workflowId;
        this.generationNumber = generationNumber;
        this.ctx = ctx;
        this.component = component;
        this.journalEntries = journalEntries;
        this.receiver = receiver;
        this.now = now;
        this.workpoolOptions = workpoolOptions;
        this.journalEntrySize = journalEntries.reduce((size, entry) => size + journalEntrySize(entry), 0);
        if (this.journalEntrySize > MAX_JOURNAL_SIZE) {
            throw new Error(journalSizeError(this.journalEntrySize, this.workflowId));
        }
    }
    async run() {
        while (true) {
            const message = await this.receiver.get();
            // In the future we can correlate the calls to entries by handle, args,
            // etc. instead of just ordering. As is, the fn order can't change.
            const entry = this.journalEntries.shift();
            // why not to run queries inline: they fetch too much data internally
            if (entry) {
                this.completeMessage(message, entry);
                continue;
            }
            const messages = [message];
            const size = this.receiver.bufferSize;
            for (let i = 0; i < size; i++) {
                const message = await this.receiver.get();
                messages.push(message);
            }
            const entries = await this.startSteps(messages);
            for (const entry of entries) {
                this.journalEntrySize += journalEntrySize(entry);
                if (this.journalEntrySize > MAX_JOURNAL_SIZE) {
                    throw new Error(journalSizeError(this.journalEntrySize, this.workflowId) +
                        ` The failing step was ${entry.step.name} (${entry._id})`);
                }
            }
            const hasInProgress = entries.some((entry) => entry.step.inProgress);
            if (hasInProgress) {
                return {
                    type: "executorBlocked",
                };
            }
            for (let i = 0; i < entries.length; i++) {
                this.completeMessage(messages[i], entries[i]);
            }
        }
    }
    getGenerationState() {
        if (this.journalEntries.length <= this.receiver.bufferSize) {
            return { now: this.now, latest: true };
        }
        return {
            // We use the next entry's startedAt, since we're in code just before that
            // step is invoked. We use the bufferSize, since multiple steps may be
            // currently enqueued in one generation, but the code after it has already
            // started executing.
            now: this.journalEntries[this.receiver.bufferSize].step.startedAt,
            latest: false,
        };
    }
    completeMessage(message, entry) {
        if (entry.step.inProgress) {
            throw new Error(`Assertion failed: not blocked but have in-progress journal entry`);
        }
        if (message.type !== "signal" && message.type !== "signalAll" && message.type !== "signalRace" && message.type !== "signalAny") {
            const stepArgsJson = JSON.stringify(convexToJson(entry.step.args));
            const messageArgsJson = JSON.stringify(convexToJson(message.args));
            if (stepArgsJson !== messageArgsJson) {
                throw new Error(`Journal entry mismatch: ${entry.step.args} !== ${message.args}`);
            }
        }
        if (entry.step.runResult === undefined) {
            throw new Error(`Assertion failed: no outcome for completed function call`);
        }
        switch (entry.step.runResult.kind) {
            case "success":
                message.resolve(entry.step.runResult.returnValue);
                break;
            case "failed":
                message.reject(new Error(entry.step.runResult.error));
                break;
            case "canceled":
                message.reject(new Error("Canceled"));
                break;
        }
    }
    async startSteps(messages) {
        const steps = await Promise.all(messages.map(async (message) => {
            if (message.type === "execution") {
                const step = {
                    type: "execution",
                    inProgress: true,
                    name: message.name,
                    functionType: message.functionType,
                    handle: await createFunctionHandle(message.function),
                    args: message.args,
                    argsSize: valueSize(message.args),
                    runResult: undefined,
                    startedAt: this.now,
                    completedAt: undefined,
                };
                return {
                    retry: message.retry,
                    schedulerOptions: message.schedulerOptions,
                    step,
                };
            }
            if (message.type === "pause") {
                const step = {
                    type: "pause",
                    inProgress: true,
                    name: message.name,
                    onPauseHandle: message.onPauseFunction
                        ? await createFunctionHandle(message.onPauseFunction)
                        : undefined,
                    args: message.args,
                    argsSize: valueSize(message.args),
                    runResult: undefined,
                    startedAt: this.now,
                    completedAt: undefined,
                };
                return {
                    retry: undefined,
                    schedulerOptions: message.schedulerOptions,
                    step,
                };
            }
            if (message.type === "signal") {
                const signalStep = {
                    type: "signal",
                    inProgress: true,
                    name: message.name,
                    signalId: message.signalHandle.signalId,
                    args: message.args,
                    argsSize: valueSize(message.args),
                    runResult: undefined,
                    startedAt: this.now,
                    completedAt: undefined,
                    timeoutMs: message.timeoutMs,
                    timeoutScheduledAt: undefined,
                };
                return {
                    retry: undefined,
                    schedulerOptions: undefined,
                    step: signalStep,
                };
            }
            if (message.type === "signalAll") {
                const groupId = `all_${this.now}_${Math.random()}`;
                const signalIds = Object.values(message.handles).map(h => h.signalId);
                const signalKeyMap = Object.fromEntries(Object.entries(message.handles).map(([key, handle]) => [handle.signalId, key]));
                const signalStep = {
                    type: "signal",
                    inProgress: true,
                    name: message.name,
                    signalId: signalIds[0],
                    args: message.args,
                    argsSize: valueSize(message.args),
                    runResult: undefined,
                    startedAt: this.now,
                    completedAt: undefined,
                    helperType: "all",
                    groupId,
                    groupMembers: signalIds,
                    signalKeyMap,
                };
                return {
                    retry: undefined,
                    schedulerOptions: undefined,
                    step: signalStep,
                };
            }
            if (message.type === "signalRace") {
                const groupId = `race_${this.now}_${Math.random()}`;
                const signalIds = Object.values(message.handles).map(h => h.signalId);
                const signalKeyMap = Object.fromEntries(Object.entries(message.handles).map(([key, handle]) => [handle.signalId, key]));
                const signalStep = {
                    type: "signal",
                    inProgress: true,
                    name: message.name,
                    signalId: signalIds[0],
                    args: message.args,
                    argsSize: valueSize(message.args),
                    runResult: undefined,
                    startedAt: this.now,
                    completedAt: undefined,
                    timeoutMs: message.timeoutMs,
                    timeoutScheduledAt: undefined,
                    helperType: "race",
                    groupId,
                    groupMembers: signalIds,
                    signalKeyMap,
                };
                return {
                    retry: undefined,
                    schedulerOptions: undefined,
                    step: signalStep,
                };
            }
            if (message.type === "signalAny") {
                const groupId = `any_${this.now}_${Math.random()}`;
                const signalIds = Object.values(message.handles).map(h => h.signalId);
                const signalKeyMap = Object.fromEntries(Object.entries(message.handles).map(([key, handle]) => [handle.signalId, key]));
                const signalStep = {
                    type: "signal",
                    inProgress: true,
                    name: message.name,
                    signalId: signalIds[0],
                    args: message.args,
                    argsSize: valueSize(message.args),
                    runResult: undefined,
                    startedAt: this.now,
                    completedAt: undefined,
                    timeoutMs: message.timeoutMs,
                    timeoutScheduledAt: undefined,
                    helperType: "any",
                    groupId,
                    groupMembers: signalIds,
                    signalKeyMap,
                    minRequired: message.min ?? 1,
                };
                return {
                    retry: undefined,
                    schedulerOptions: undefined,
                    step: signalStep,
                };
            }
            throw new Error(`Unknown message type: ${message.type}`);
        }));
        const entries = (await this.ctx.runMutation(this.component.journal.startSteps, {
            workflowId: this.workflowId,
            generationNumber: this.generationNumber,
            steps,
            workpoolOptions: this.workpoolOptions,
        }));
        return entries;
    }
}
function journalSizeError(size, workflowId) {
    const lines = [
        `Workflow ${workflowId} journal size limit exceeded (${size} bytes > ${MAX_JOURNAL_SIZE} bytes).`,
        "Consider breaking up the workflow into multiple runs, using smaller step \
    arguments or return values, or using fewer steps.",
    ];
    return lines.join("\n");
}
//# sourceMappingURL=step.js.map