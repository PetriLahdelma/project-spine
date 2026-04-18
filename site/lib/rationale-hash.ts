import { createHash, randomBytes } from "node:crypto";
import { stableStringify } from "./template-hash";

/** Hash the full rationale payload for idempotent re-publish. */
export function rationaleContentHash(params: {
  projectName: string;
  title: string;
  spineHash: string;
  contentMd: string;
}): string {
  return "sha256:" + createHash("sha256").update(stableStringify(params)).digest("hex");
}

/**
 * Short, unguessable public slug. 10 bytes base64url ~= 14 chars.
 * Unguessable is the only access control for public rationales — revocation
 * is the escape hatch.
 */
export function newRationaleSlug(): string {
  return randomBytes(10).toString("base64url");
}
