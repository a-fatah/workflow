import { type RegisteredMutation, type ReturnValueForOptionalValidator } from "convex/server";
import { type ObjectType, type PropertyValidators, type Validator } from "convex/values";
import type { WorkflowDefinition } from "./index.js";
import { type WorkpoolOptions } from "@convex-dev/workpool";
import { type WorkflowComponent, type SignalsDefinition } from "./types.js";
export declare function workflowMutation<ArgsValidator extends PropertyValidators, ReturnsValidator extends Validator<any, "required", any> | void = any, ReturnValue extends ReturnValueForOptionalValidator<ReturnsValidator> = any, SignalsValidator extends SignalsDefinition = SignalsDefinition>(component: WorkflowComponent, registered: WorkflowDefinition<ArgsValidator, ReturnsValidator, ReturnValue, SignalsValidator>, defaultWorkpoolOptions?: WorkpoolOptions): RegisteredMutation<"internal", ObjectType<ArgsValidator>, void>;
//# sourceMappingURL=workflowMutation.d.ts.map