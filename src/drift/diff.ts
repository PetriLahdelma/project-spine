import { readFile } from "node:fs/promises";
import { resolve, join, basename } from "node:path";
import { createPatch } from "diff";
import type { DriftReport, DriftItem } from "./check.js";

export type DriftDiffEntry =
  | { kind: "input"; driftKind: DriftItem["kind"]; path: string | null; stored: string | null; current: string | null; detail: string }
  | { kind: "export"; driftKind: DriftItem["kind"]; path: string; patch: string | null; detail: string }
  | { kind: "manifest-missing"; detail: string };

export type DriftDiff = {
  schemaVersion: 1;
  clean: boolean;
  checkedAt: string;
  storedSpineHash: string | null;
  currentSpineHash: string | null;
  entries: DriftDiffEntry[];
};

export type BuildDiffOptions = {
  repo: string;
  out?: string;
  report: DriftReport;
};

/**
 * Build a unified-diff view over a DriftReport. For hand-edited exports we
 * read the canonical copy in .project-spine/exports/ as the "stored" side and
 * the repo-root/generated file as the "current" side; for input drift we pass
 * through hash info only (inputs can be large and a hash change is enough for
 * the CI signal).
 */
export async function buildDriftDiff(opts: BuildDiffOptions): Promise<DriftDiff> {
  const root = resolve(opts.repo);
  const outDir = resolve(root, opts.out ?? ".project-spine");
  const entries: DriftDiffEntry[] = [];

  for (const item of opts.report.items) {
    if (item.kind === "manifest:missing") {
      entries.push({ kind: "manifest-missing", detail: item.detail });
      continue;
    }
    if (item.kind === "export:hand-edited" && item.path) {
      const patch = await buildExportPatch(root, outDir, item.path);
      entries.push({ kind: "export", driftKind: item.kind, path: item.path, patch, detail: item.detail });
      continue;
    }
    if (item.kind === "export:missing" && item.path) {
      entries.push({ kind: "export", driftKind: item.kind, path: item.path, patch: null, detail: item.detail });
      continue;
    }
    entries.push({
      kind: "input",
      driftKind: item.kind,
      path: item.path,
      stored: item.stored,
      current: item.current,
      detail: item.detail,
    });
  }

  return {
    schemaVersion: 1,
    clean: opts.report.clean,
    checkedAt: opts.report.checkedAt,
    storedSpineHash: opts.report.storedSpineHash,
    currentSpineHash: opts.report.currentSpineHash,
    entries,
  };
}

async function buildExportPatch(root: string, outDir: string, exportPath: string): Promise<string | null> {
  const canonical = join(outDir, "exports", basename(exportPath));
  const current = resolve(root, exportPath);
  try {
    const [a, b] = await Promise.all([readFile(canonical, "utf8"), readFile(current, "utf8")]);
    if (a === b) return null;
    return createPatch(exportPath, a, b, "last compile", "current");
  } catch {
    return null;
  }
}

/**
 * Render a DriftDiff as human-readable text with unified diffs inline.
 */
export function renderDriftDiffText(diff: DriftDiff): string {
  if (diff.clean) return "clean — no drift between stored manifest and current state.\n";

  const lines: string[] = [];
  const inputEntries = diff.entries.filter((e): e is Extract<DriftDiffEntry, { kind: "input" }> => e.kind === "input");
  const exportEntries = diff.entries.filter(
    (e): e is Extract<DriftDiffEntry, { kind: "export" }> => e.kind === "export",
  );
  const manifestMissing = diff.entries.find((e) => e.kind === "manifest-missing");

  if (manifestMissing) {
    lines.push("manifest missing:");
    lines.push(`  ${manifestMissing.detail}`);
    lines.push("");
    return lines.join("\n");
  }

  if (inputEntries.length > 0) {
    lines.push(`inputs (${inputEntries.length}):`);
    for (const e of inputEntries) {
      const pathStr = e.path ?? "(no path)";
      const hashes =
        e.stored && e.current
          ? `  ${short(e.stored)} → ${short(e.current)}`
          : e.current
            ? `  (added, ${short(e.current)})`
            : e.stored
              ? `  (removed, was ${short(e.stored)})`
              : "";
      lines.push(`  [${e.driftKind}] ${pathStr}${hashes ? "\n  " + hashes : ""}`);
      lines.push(`    ${e.detail}`);
    }
    lines.push("");
  }

  if (exportEntries.length > 0) {
    lines.push(`exports (${exportEntries.length}):`);
    for (const e of exportEntries) {
      lines.push(`  [${e.driftKind}] ${e.path} — ${e.detail}`);
      if (e.patch) {
        lines.push("");
        lines.push(indent(e.patch.trim(), "    "));
        lines.push("");
      }
    }
  }

  return lines.join("\n") + "\n";
}

function short(hash: string): string {
  return hash.length > 12 ? hash.slice(0, 12) : hash;
}

function indent(s: string, prefix: string): string {
  return s
    .split("\n")
    .map((l) => (l.length > 0 ? prefix + l : l))
    .join("\n");
}
