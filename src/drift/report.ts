import type { DriftReport } from "./check.js";

export function renderDriftReportMd(report: DriftReport): string {
  const lines: string[] = [];
  lines.push(`# Drift report`);
  lines.push("");
  lines.push(`_Checked at ${report.checkedAt}._`);
  lines.push("");

  if (report.clean) {
    lines.push(`✅ **No drift detected.** Stored spine hash matches current: \`${report.storedSpineHash}\`.`);
    lines.push("");
    lines.push("<!-- spine:deterministic -->");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(`⚠ **Drift detected** — ${report.counts.total} item${report.counts.total === 1 ? "" : "s"}.`);
  lines.push("");
  lines.push(`- Stored spine hash: \`${report.storedSpineHash ?? "(none)"}\``);
  lines.push(`- Current spine hash: \`${report.currentSpineHash ?? "(none)"}\``);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(`- Input drift: ${report.counts.inputDrift}`);
  lines.push(`- Export hand-edits: ${report.counts.exportHandEdits}`);
  lines.push(`- Missing exports: ${report.counts.missingExports}`);
  lines.push("");

  const inputs = report.items.filter((i) => i.kind.startsWith("input:") || i.kind === "spine:hash");
  if (inputs.length > 0) {
    lines.push(`## Input drift`);
    lines.push("");
    for (const i of inputs) {
      lines.push(`- **${i.kind}**${i.path ? ` (\`${i.path}\`)` : ""} — ${i.detail}`);
    }
    lines.push("");
  }

  const handEdits = report.items.filter((i) => i.kind === "export:hand-edited");
  if (handEdits.length > 0) {
    lines.push(`## Hand-edited exports`);
    lines.push("");
    for (const i of handEdits) {
      lines.push(`- \`${i.path}\` — edited since last compile.`);
    }
    lines.push("");
    lines.push(
      `> To accept these edits, update the upstream input so a recompile reproduces them. To discard, run \`spine export --targets all\`.`
    );
    lines.push("");
  }

  const missing = report.items.filter((i) => i.kind === "export:missing");
  if (missing.length > 0) {
    lines.push(`## Missing exports`);
    lines.push("");
    for (const i of missing) lines.push(`- \`${i.path}\``);
    lines.push("");
    lines.push("> Run \`spine export --targets all\` to regenerate.");
    lines.push("");
  }

  const manifestMissing = report.items.filter((i) => i.kind === "manifest:missing");
  if (manifestMissing.length > 0) {
    lines.push(`## Manifest missing`);
    lines.push("");
    for (const i of manifestMissing) lines.push(`- ${i.detail}`);
    lines.push("");
  }

  lines.push("<!-- spine:deterministic -->");
  lines.push("");
  return lines.join("\n");
}
