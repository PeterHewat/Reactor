import { api } from "@convex/api";
import type { FunctionReference } from "convex/server";

const mod = api.tasks;
if (!mod) {
  throw new Error("Convex tasks API is not available");
}

type TasksConvexApi = {
  list: FunctionReference<"query">;
  create: FunctionReference<"mutation">;
  update: FunctionReference<"mutation">;
  remove: FunctionReference<"mutation">;
};

/** Typed refs for `api.tasks.*` (nested keys are optional under solution `tsc -b`). */
export const tasksConvexApi = mod as unknown as TasksConvexApi;
