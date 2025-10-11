/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as example from "../example.js";
import type * as transcription from "../transcription.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  example: typeof example;
  transcription: typeof transcription;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  workflow: {
    events: {
      defineTopic: FunctionReference<
        "mutation",
        "internal",
        { name: string; validator: any },
        string
      >;
      getEventStatus: FunctionReference<
        "query",
        "internal",
        { eventId: string },
        {
          event: {
            _creationTime: number;
            _id: string;
            completedAt?: number;
            createdAt: number;
            idempotencyKey?: string;
            lastError?: string;
            metadata?: any;
            payload: any;
            retryCount: number;
            status: "pending" | "dispatching" | "completed" | "failed";
            topicId: string;
          };
          workflows: Array<{
            _creationTime: number;
            _id: string;
            completedAt?: number;
            createdAt: number;
            eventId: string;
            status: "pending" | "running" | "completed" | "failed" | "canceled";
            workflowHandle: string;
            workflowId: string;
          }>;
        }
      >;
      getTopicByName: FunctionReference<
        "query",
        "internal",
        { name: string },
        {
          _creationTime: number;
          _id: string;
          createdAt: number;
          name: string;
          validator: any;
        } | null
      >;
      listEventsByTopic: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          status?: "pending" | "dispatching" | "completed" | "failed";
          topicId: string;
        },
        {
          events: Array<{
            _creationTime: number;
            _id: string;
            completedAt?: number;
            createdAt: number;
            idempotencyKey?: string;
            lastError?: string;
            metadata?: any;
            payload: any;
            retryCount: number;
            status: "pending" | "dispatching" | "completed" | "failed";
            topicId: string;
          }>;
        }
      >;
      listPendingEvents: FunctionReference<
        "query",
        "internal",
        { limit?: number; topicId?: string },
        {
          count: number;
          events: Array<{
            _creationTime: number;
            _id: string;
            completedAt?: number;
            createdAt: number;
            idempotencyKey?: string;
            lastError?: string;
            metadata?: any;
            payload: any;
            retryCount: number;
            status: "pending" | "dispatching" | "completed" | "failed";
            topicId: string;
          }>;
        }
      >;
      publishEvent: FunctionReference<
        "mutation",
        "internal",
        {
          idempotencyKey?: string;
          metadata?: any;
          payload: any;
          topicId: string;
        },
        { eventId: string; workflowIds: Array<string> }
      >;
      registerWorkflow: FunctionReference<
        "mutation",
        "internal",
        { topicId: string; workflowHandle: string },
        null
      >;
      replayEvent: FunctionReference<
        "mutation",
        "internal",
        { eventId: string; workflowHandle?: string },
        { workflowIds: Array<string> }
      >;
      unregisterWorkflow: FunctionReference<
        "mutation",
        "internal",
        { topicId: string; workflowHandle: string },
        boolean
      >;
    };
    journal: {
      load: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          journalEntries: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  type: "execution";
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  inProgress: boolean;
                  name: string;
                  onPauseHandle?: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  type: "pause";
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  completedKeys?: Array<string>;
                  groupId?: string;
                  groupMembers?: Array<string>;
                  helperType?: "all" | "race" | "any";
                  inProgress: boolean;
                  minRequired?: number;
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  signalId: string;
                  signalKeyMap?: any;
                  startedAt: number;
                  timeoutMs?: number;
                  timeoutScheduledAt?: number;
                  type: "signal";
                  winnerKey?: string;
                  workId?: string;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          ok: boolean;
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      resume: FunctionReference<
        "mutation",
        "internal",
        {
          name?: string;
          resumeValue: any;
          workflowHandle: string;
          workflowId: string;
        },
        null
      >;
      startSteps: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          steps: Array<{
            retry?:
              | boolean
              | { base: number; initialBackoffMs: number; maxAttempts: number };
            schedulerOptions?: { runAt?: number } | { runAfter?: number };
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  type: "execution";
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  inProgress: boolean;
                  name: string;
                  onPauseHandle?: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  type: "pause";
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  completedKeys?: Array<string>;
                  groupId?: string;
                  groupMembers?: Array<string>;
                  helperType?: "all" | "race" | "any";
                  inProgress: boolean;
                  minRequired?: number;
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  signalId: string;
                  signalKeyMap?: any;
                  startedAt: number;
                  timeoutMs?: number;
                  timeoutScheduledAt?: number;
                  type: "signal";
                  winnerKey?: string;
                  workId?: string;
                };
          }>;
          workflowId: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        Array<{
          _creationTime: number;
          _id: string;
          step:
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                functionType: "query" | "mutation" | "action";
                handle: string;
                inProgress: boolean;
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                type: "execution";
                workId?: string;
              }
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                inProgress: boolean;
                name: string;
                onPauseHandle?: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                type: "pause";
                workId?: string;
              }
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                completedKeys?: Array<string>;
                groupId?: string;
                groupMembers?: Array<string>;
                helperType?: "all" | "race" | "any";
                inProgress: boolean;
                minRequired?: number;
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                signalId: string;
                signalKeyMap?: any;
                startedAt: number;
                timeoutMs?: number;
                timeoutScheduledAt?: number;
                type: "signal";
                winnerKey?: string;
                workId?: string;
              };
          stepNumber: number;
          workflowId: string;
        }>
      >;
    };
    signals: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { reason: string; signalId: string },
        null
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          metadata?: any;
          name: string;
          validator?: any;
          workflowId: string;
        },
        {
          generationNumber: number;
          name: string;
          signalId: string;
          workflowId: string;
        }
      >;
      load: FunctionReference<
        "query",
        "internal",
        { signalId: string },
        {
          _creationTime: number;
          _id: string;
          cancelReason?: string;
          completedAt?: number;
          error?: string;
          generationNumber: number;
          groupId?: string;
          helperKey?: string;
          helperType?: "all" | "race" | "any";
          metadata?: any;
          name: string;
          state: "pending" | "fulfilled" | "rejected" | "cancelled";
          validator?: any;
          value?: any;
          waitingStepId?: string;
          workflowId: string;
        }
      >;
      reject: FunctionReference<
        "mutation",
        "internal",
        { error: string; signalId: string },
        null
      >;
      resolve: FunctionReference<
        "mutation",
        "internal",
        { metadata?: any; signalId: string; value?: any },
        null
      >;
      updateMetadata: FunctionReference<
        "mutation",
        "internal",
        { metadata: any; signalId: string },
        null
      >;
    };
    workflow: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        null
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        boolean
      >;
      complete: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          runResult:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId: string;
        },
        null
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          maxParallelism?: number;
          onComplete?: { context?: any; fnHandle: string };
          startAsync?: boolean;
          workflowArgs: any;
          workflowHandle: string;
          workflowName: string;
        },
        string
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          inProgress: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  type: "execution";
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  inProgress: boolean;
                  name: string;
                  onPauseHandle?: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  type: "pause";
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  completedKeys?: Array<string>;
                  groupId?: string;
                  groupMembers?: Array<string>;
                  helperType?: "all" | "race" | "any";
                  inProgress: boolean;
                  minRequired?: number;
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  signalId: string;
                  signalKeyMap?: any;
                  startedAt: number;
                  timeoutMs?: number;
                  timeoutScheduledAt?: number;
                  type: "signal";
                  winnerKey?: string;
                  workId?: string;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
    };
  };
};
