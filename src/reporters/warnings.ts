import type { SpineModel } from "../model/spine.js";

export function renderWarningsJson(spine: SpineModel): string {
  return JSON.stringify(
    { count: spine.warnings.length, warnings: spine.warnings },
    null,
    2
  ) + "\n";
}
