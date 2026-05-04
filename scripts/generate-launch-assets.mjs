#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "docs", "product-hunt", "assets");
const PUBLIC = join(ROOT, "site", "public");

const COLORS = {
  bg: "#07070a",
  panel: "#101116",
  panel2: "#171820",
  ink: "#f7f4ee",
  dim: "#a4a7b5",
  cyan: "#45f4ff",
  pink: "#ff4fb4",
  lime: "#d7ff59",
  line: "#30323d",
  red: "#ff6b6b",
};

await mkdir(OUT, { recursive: true });
await mkdir(PUBLIC, { recursive: true });

await asset("product-hunt-thumbnail", 600, 600, thumbnail());
await asset("gallery-01-hero", 1270, 760, hero());
await asset("gallery-02-compile", 1270, 760, compile());
await asset("gallery-03-drift", 1270, 760, drift());
await asset("gallery-04-agents", 1270, 760, agents());
await asset("social-share", 1200, 630, social(), { also: join(PUBLIC, "og.png") });

function shell(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    const rendered = [command, ...args].join(" ");
    throw new Error(`${rendered} failed with exit code ${result.status ?? "unknown"}`);
  }
}

async function asset(name, width, height, body, options = {}) {
  const svgPath = join(OUT, `${name}.svg`);
  const pngPath = join(OUT, `${name}.png`);
  await writeFile(svgPath, clean(svg(width, height, body)), "utf8");
  shell("magick", [svgPath, pngPath]);
  if (options.also) shell("magick", [svgPath, options.also]);
}

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${COLORS.bg}"/>
  ${body}
</svg>
`;
}

function wordmark(x, y, scale = 1) {
  const fs = 58 * scale;
  return `
  <text x="${x}" y="${y}" font-family="Arial Black, Arial, sans-serif" font-size="${fs}" font-weight="900" letter-spacing="0" fill="${COLORS.ink}">PROJECT</text>
  <text x="${x}" y="${y + fs * 0.9}" font-family="Arial Black, Arial, sans-serif" font-size="${fs}" font-weight="900" letter-spacing="0" fill="${COLORS.pink}">SPINE</text>`;
}

function pill(x, y, text, color = COLORS.cyan) {
  const width = 18 + text.length * 10.4;
  return `
  <rect x="${x}" y="${y}" width="${width}" height="34" rx="17" fill="${color}" opacity="0.14"/>
  <text x="${x + 14}" y="${y + 23}" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${color}">${esc(text)}</text>`;
}

function text(x, y, value, size, color = COLORS.ink, weight = 700) {
  return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`;
}

function mono(x, y, value, size = 24, color = COLORS.ink, weight = 700) {
  return `<text x="${x}" y="${y}" font-family="Menlo, Consolas, monospace" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`;
}

function wrap(x, y, value, size, lineHeight, width, color = COLORS.ink, weight = 700) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = "";
  const max = Math.max(10, Math.floor(width / (size * 0.56)));
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">
${lines.map((l, i) => `    <tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(l)}</tspan>`).join("\n")}
  </text>`;
}

function terminal(x, y, w, h, lines) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${COLORS.panel}" stroke="${COLORS.line}" stroke-width="2"/>
  <circle cx="${x + 34}" cy="${y + 34}" r="8" fill="${COLORS.red}"/>
  <circle cx="${x + 60}" cy="${y + 34}" r="8" fill="#ffd166"/>
  <circle cx="${x + 86}" cy="${y + 34}" r="8" fill="#78f59c"/>
  ${lines.map((l, i) => mono(x + 34, y + 86 + i * 39, l.text, l.size ?? 24, l.color ?? COLORS.ink, l.weight ?? 700)).join("\n")}`;
}

function thumbnail() {
  return `
  <rect x="32" y="32" width="536" height="536" rx="72" fill="${COLORS.panel}" stroke="${COLORS.line}" stroke-width="2"/>
  <circle cx="470" cy="126" r="78" fill="${COLORS.cyan}" opacity="0.2"/>
  <circle cx="140" cy="470" r="96" fill="${COLORS.pink}" opacity="0.22"/>
  ${wordmark(74, 190, 1.05)}
  ${wrap(74, 362, "Drift-proof context for coding agents", 32, 42, 430, COLORS.ink, 800)}
  ${pill(74, 486, "MIT CLI", COLORS.lime)}`;
}

function hero() {
  return `
  ${pill(72, 74, "Product Hunt launch kit", COLORS.pink)}
  ${wordmark(72, 198, 1.2)}
  ${wrap(72, 394, "Drift-proof context for coding agents.", 58, 66, 650, COLORS.ink, 900)}
  ${wrap(72, 552, "Compile a brief, repo, and design tokens into AGENTS.md, CLAUDE.md, Copilot, Cursor rules, scaffold plans, QA guardrails, and a CI drift gate.", 27, 36, 760, COLORS.dim, 500)}
  <rect x="870" y="116" width="302" height="430" rx="26" fill="${COLORS.panel}" stroke="${COLORS.line}" stroke-width="2"/>
  ${text(910, 184, "brief.md", 27, COLORS.cyan)}
  ${text(910, 247, "repo/", 27, COLORS.pink)}
  ${text(910, 310, "tokens.json", 27, COLORS.lime)}
  ${text(910, 392, "spine.json", 32, COLORS.ink, 900)}
  ${text(910, 457, "agent files", 27, COLORS.dim, 700)}
  <path d="M1022 330 L1022 358" stroke="${COLORS.cyan}" stroke-width="4"/>
  <path d="M993 349 L1022 378 L1051 349" fill="none" stroke="${COLORS.cyan}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function compile() {
  return `
  ${pill(72, 66, "One command", COLORS.cyan)}
  ${wrap(72, 148, "Generate the operating layer agents actually load.", 54, 64, 720, COLORS.ink, 900)}
  ${terminal(72, 306, 780, 364, [
    { text: "$ spine compile --brief ./brief.md --repo .", color: COLORS.cyan },
    { text: "compiled spine for \"acme-payroll\" v0.1.0" },
    { text: "agent files: AGENTS.md 5.5 KB, CLAUDE.md 2.3 KB" },
    { text: "             Copilot 2.9 KB, Cursor 868 B" },
    { text: "wrote 21 files under ./.project-spine and repo root", color: COLORS.lime },
  ])}
  <rect x="910" y="110" width="286" height="520" rx="26" fill="${COLORS.panel}" stroke="${COLORS.line}" stroke-width="2"/>
  ${text(946, 178, "21", 96, COLORS.pink, 900)}
  ${wrap(946, 248, "generated files from one deterministic source", 25, 32, 210, COLORS.ink, 800)}
  ${text(946, 410, "0", 88, COLORS.cyan, 900)}
  ${wrap(946, 470, "network calls in compile path", 25, 32, 210, COLORS.ink, 800)}`;
}

function drift() {
  return `
  ${pill(72, 66, "CI-ready drift detection", COLORS.lime)}
  ${wrap(72, 148, "Treat agent instructions like code, not stale notes.", 54, 64, 780, COLORS.ink, 900)}
  <rect x="72" y="300" width="520" height="300" rx="24" fill="${COLORS.panel}" stroke="${COLORS.line}" stroke-width="2"/>
  ${text(112, 362, "brief.md changed", 32, COLORS.red, 900)}
  ${mono(112, 428, "- AGENTS.md hash old", 25, COLORS.red)}
  ${mono(112, 478, "+ AGENTS.md hash new", 25, COLORS.lime)}
  ${mono(112, 528, "drift check exits 1", 25, COLORS.ink)}
  <rect x="676" y="300" width="520" height="300" rx="24" fill="${COLORS.panel}" stroke="${COLORS.line}" stroke-width="2"/>
  ${text(716, 362, "reviewer sees why", 32, COLORS.cyan, 900)}
  ${mono(716, 428, "source: brief.md#section0/item3", 25, COLORS.ink)}
  ${mono(716, 478, "source: repo-profile#framework", 25, COLORS.ink)}
  ${mono(716, 528, "source: template:api-service", 25, COLORS.ink)}`;
}

function agents() {
  const card = (x, y, title, file, color) => `
  <rect x="${x}" y="${y}" width="260" height="236" rx="24" fill="${COLORS.panel}" stroke="${COLORS.line}" stroke-width="2"/>
  <circle cx="${x + 54}" cy="${y + 58}" r="20" fill="${color}" opacity="0.85"/>
  ${text(x + 34, y + 124, title, 32, COLORS.ink, 900)}
  ${wrap(x + 34, y + 170, file, 22, 30, 190, COLORS.dim, 700)}`;
  return `
  ${pill(72, 66, "Portable context", COLORS.cyan)}
  ${wrap(72, 148, "One spine.json fans out to every agent file.", 54, 64, 860, COLORS.ink, 900)}
  ${card(72, 346, "Codex", "AGENTS.md", COLORS.cyan)}
  ${card(364, 346, "Claude", "CLAUDE.md", COLORS.pink)}
  ${card(656, 346, "Copilot", ".github instructions", COLORS.lime)}
  ${card(948, 346, "Cursor", ".cursor/rules project-spine.mdc", "#9f7aea")}`;
}

function social() {
  return `
  ${wordmark(68, 164, 1)}
  ${wrap(68, 326, "Drift-proof context for coding agents.", 58, 66, 660, COLORS.ink, 900)}
  ${wrap(68, 486, "Brief + repo + design tokens -> AGENTS.md, CLAUDE.md, Copilot, Cursor, QA, backlog, drift checks.", 27, 36, 710, COLORS.dim, 500)}
  ${terminal(790, 96, 330, 432, [
    { text: "$ spine compile", color: COLORS.cyan, size: 22 },
    { text: "hash: 3333f867f40d3e43", size: 20 },
    { text: "agent files: 4", size: 20 },
    { text: "warnings: 0", size: 20 },
    { text: "$ spine drift check", color: COLORS.cyan, size: 22 },
    { text: "clean", color: COLORS.lime, size: 22 },
  ])}`;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function clean(content) {
  return content
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}
