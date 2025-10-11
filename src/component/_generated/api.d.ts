/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as events from "../events.js";
import type * as journal from "../journal.js";
import type * as logging from "../logging.js";
import type * as model from "../model.js";
import type * as pool from "../pool.js";
import type * as signals from "../signals.js";
import type * as utils from "../utils.js";
import type * as workflow from "../workflow.js";

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
  events: typeof events;
  journal: typeof journal;
  logging: typeof logging;
  model: typeof model;
  pool: typeof pool;
  signals: typeof signals;
  utils: typeof utils;
  workflow: typeof workflow;
}>;
export type Mounts = {
  events: {
    defineTopic: FunctionReference<
      "mutation",
      "public",
      { name: string; validator: any },
      string
    >;
    getEventStatus: FunctionReference<
      "query",
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
      { topicId: string; workflowHandle: string },
      null
    >;
    replayEvent: FunctionReference<
      "mutation",
      "public",
      { eventId: string; workflowHandle?: string },
      { workflowIds: Array<string> }
    >;
    unregisterWorkflow: FunctionReference<
      "mutation",
      "public",
      { topicId: string; workflowHandle: string },
      boolean
    >;
  };
  journal: {
    load: FunctionReference<
      "query",
      "public",
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
      "public",
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
      "public",
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
      "public",
      { reason: string; signalId: string },
      null
    >;
    create: FunctionReference<
      "mutation",
      "public",
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
      "public",
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
      "public",
      { error: string; signalId: string },
      null
    >;
    resolve: FunctionReference<
      "mutation",
      "public",
      { metadata?: any; signalId: string; value?: any },
      null
    >;
    updateMetadata: FunctionReference<
      "mutation",
      "public",
      { metadata: any; signalId: string },
      null
    >;
  };
  workflow: {
    cancel: FunctionReference<
      "mutation",
      "public",
      { workflowId: string },
      null
    >;
    cleanup: FunctionReference<
      "mutation",
      "public",
      { workflowId: string },
      boolean
    >;
    complete: FunctionReference<
      "mutation",
      "public",
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
      "public",
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
      "public",
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
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
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
  workpool: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        {
          id: string;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
        },
        any
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        {
          before?: number;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
        },
        any
      >;
      enqueue: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism: number;
          };
          fnArgs: any;
          fnHandle: string;
          fnName: string;
          fnType: "action" | "mutation" | "query";
          onComplete?: { context?: any; fnHandle: string };
          retryBehavior?: {
            base: number;
            initialBackoffMs: number;
            maxAttempts: number;
          };
          runAt: number;
        },
        string
      >;
      enqueueBatch: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism: number;
          };
          items: Array<{
            fnArgs: any;
            fnHandle: string;
            fnName: string;
            fnType: "action" | "mutation" | "query";
            onComplete?: { context?: any; fnHandle: string };
            retryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            runAt: number;
          }>;
        },
        Array<string>
      >;
      status: FunctionReference<
        "query",
        "internal",
        { id: string },
        | { previousAttempts: number; state: "pending" }
        | { previousAttempts: number; state: "running" }
        | { state: "finished" }
      >;
      statusBatch: FunctionReference<
        "query",
        "internal",
        { ids: Array<string> },
        Array<
          | { previousAttempts: number; state: "pending" }
          | { previousAttempts: number; state: "running" }
          | { state: "finished" }
        >
      >;
    };
  };
};
