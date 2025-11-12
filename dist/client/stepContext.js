import { BaseChannel } from "async-channel";
import { safeFunctionName } from "./safeFunctionName.js";
export class StepContext {
    workflowId;
    sender;
    component;
    ctx;
    generationNumber;
    signalsSchema;
    signals;
    constructor(workflowId, sender, component, ctx, generationNumber, signalsSchema) {
        this.workflowId = workflowId;
        this.sender = sender;
        this.component = component;
        this.ctx = ctx;
        this.generationNumber = generationNumber;
        this.signalsSchema = signalsSchema;
        this.signals = this.createSignalHelpers();
    }
    createSignalHelpers() {
        return {
            create: ((nameOrConfig, config) => {
                if (typeof nameOrConfig === "string" && config) {
                    return this.createDynamicSignal(nameOrConfig, config);
                }
                else if (this.signalsSchema && typeof nameOrConfig === "string") {
                    return this.createPreDeclaredSignal(nameOrConfig);
                }
                throw new Error("Invalid signal create arguments");
            }),
            resolve: async (handle, value) => {
                await this.ctx.runMutation(this.component.signals.resolve, {
                    signalId: handle.signalId,
                    value,
                });
            },
            reject: async (handle, error) => {
                await this.ctx.runMutation(this.component.signals.reject, {
                    signalId: handle.signalId,
                    error,
                });
            },
            cancel: async (handle, reason) => {
                await this.ctx.runMutation(this.component.signals.cancel, {
                    signalId: handle.signalId,
                    reason,
                });
            },
            load: async (handle) => {
                return await this.ctx.runQuery(this.component.signals.load, {
                    signalId: handle.signalId,
                });
            },
            awaitSignal: async (handle, options) => {
                return this.runSignalAwait(handle, options);
            },
            all: async (handles) => {
                return this.runSignalAll(handles);
            },
            race: async (handles, options) => {
                return this.runSignalRace(handles, options);
            },
            any: async (handles, options) => {
                return this.runSignalAny(handles, options);
            },
            updateMetadata: async (handle, metadata) => {
                await this.ctx.runMutation(this.component.signals.updateMetadata, {
                    signalId: handle.signalId,
                    metadata,
                });
            },
        };
    }
    async createPreDeclaredSignal(name) {
        if (!this.signalsSchema || !(name in this.signalsSchema)) {
            throw new Error(`Signal "${String(name)}" not found in workflow signals schema`);
        }
        const signalDef = this.signalsSchema[name];
        const validator = typeof signalDef === 'object' && signalDef !== null && 'returns' in signalDef
            ? signalDef.returns
            : signalDef;
        const validatorJson = JSON.parse(JSON.stringify(validator));
        return await this.ctx.runMutation(this.component.signals.create, {
            workflowId: this.workflowId,
            generationNumber: this.generationNumber,
            name: String(name),
            validator: validatorJson,
        });
    }
    async createDynamicSignal(name, config) {
        return await this.ctx.runMutation(this.component.signals.create, {
            workflowId: this.workflowId,
            generationNumber: this.generationNumber,
            name,
            validator: config.returns,
        });
    }
    async runSignalAwait(handle, options) {
        let send;
        const p = new Promise((resolve, reject) => {
            send = this.sender.push({
                type: "signal",
                name: handle.name,
                signalHandle: handle,
                args: { signalId: handle.signalId },
                timeoutMs: options?.timeoutMs,
                resolve: resolve,
                reject,
            });
        });
        void send;
        return p;
    }
    async runSignalRace(handles, options) {
        let send;
        const p = new Promise((resolve, reject) => {
            send = this.sender.push({
                type: "signalRace",
                name: `race(${Object.keys(handles).join(",")})`,
                handles,
                args: { handles: Object.fromEntries(Object.entries(handles).map(([k, h]) => [k, h.signalId])) },
                timeoutMs: options?.timeoutMs,
                resolve: resolve,
                reject,
            });
        });
        void send;
        return p;
    }
    async runSignalAll(handles) {
        let send;
        const p = new Promise((resolve, reject) => {
            send = this.sender.push({
                type: "signalAll",
                name: `all(${Object.keys(handles).join(",")})`,
                handles,
                args: { handles: Object.fromEntries(Object.entries(handles).map(([k, h]) => [k, h.signalId])) },
                resolve: resolve,
                reject,
            });
        });
        void send;
        return p;
    }
    async runSignalAny(handles, options) {
        let send;
        const p = new Promise((resolve, reject) => {
            send = this.sender.push({
                type: "signalAny",
                name: `any(${Object.keys(handles).join(",")})`,
                handles,
                args: { handles: Object.fromEntries(Object.entries(handles).map(([k, h]) => [k, h.signalId])), min: options.min },
                timeoutMs: options?.timeoutMs,
                min: options.min,
                resolve: resolve,
                reject,
            });
        });
        void send;
        return p;
    }
    runQuery(query, args, opts) {
        return this.runFunction("query", query, args, opts);
    }
    runMutation(mutation, args, opts) {
        return this.runFunction("mutation", mutation, args, opts);
    }
    runAction(action, args, opts) {
        return this.runFunction("action", action, args, opts);
    }
    pause(opts) {
        return this.runPause(opts);
    }
    runFunction(functionType, f, args, opts) {
        const { name, retry, ...schedulerOptions } = opts ?? {};
        return this.runExecution({
            type: "execution",
            name: name ?? safeFunctionName(f),
            functionType,
            function: f,
            args: args ?? {},
            retry,
            schedulerOptions,
        });
    }
    runPause(opts) {
        let send;
        const p = new Promise((resolve, reject) => {
            send = this.sender.push({
                type: "pause",
                name: opts?.name ?? (opts?.onPause ? safeFunctionName(opts.onPause) : "pause"),
                onPauseFunction: opts?.onPause,
                args: opts?.args ?? {},
                schedulerOptions: {},
                resolve: resolve,
                reject,
            });
        });
        void send;
        return p;
    }
    async runExecution(req) {
        let send;
        const p = new Promise((resolve, reject) => {
            send = this.sender.push({
                ...req,
                resolve,
                reject,
            });
        });
        await send;
        return p;
    }
}
//# sourceMappingURL=stepContext.js.map