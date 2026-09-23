#!/usr/bin/env node

const baseUrl = process.env.PROJECT_SPINE_SITE_URL ?? "http://127.0.0.1:3000";
const routes = [
  ["/", "Teach your repository from the fixes that mattered."],
  ["/product", "A learning loop for repository guardrails."],
  ["/docs", "Run the learning loop locally."],
  ["/about", "Repositories should retain the lessons hidden in code review."],
  ["/pricing", "Free."],
  ["/security", "Local evidence. Read-only replay. Explicit network access."],
  ["/index.md", "reviewed failures"],
  ["/llms.txt", "repository-learning"],
];

const failures = [];

for (const [path, marker] of routes) {
  try {
    const response = await fetch(new URL(path, baseUrl));
    const body = await response.text();
    if (!response.ok) {
      failures.push(`${path}: HTTP ${response.status}`);
    } else if (!body.includes(marker)) {
      failures.push(`${path}: missing marker ${JSON.stringify(marker)}`);
    } else {
      process.stdout.write(`ok ${path}\n`);
    }
  } catch (error) {
    failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
}
