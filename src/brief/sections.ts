import type { CanonicalSection } from "../model/brief.js";

const aliases: Record<CanonicalSection, string[]> = {
  goals: ["goals", "goal", "objectives", "objective", "aims", "what we are building", "what we're building", "scope"],
  nonGoals: ["non-goals", "non goals", "nongoals", "out of scope", "not in scope", "explicitly out"],
  audience: ["audience", "audiences", "users", "target audience", "target users", "who", "personas", "customers"],
  constraints: ["constraints", "constraint", "requirements", "technical constraints", "must have"],
  assumptions: ["assumptions", "assumption"],
  risks: ["risks", "risk", "threats", "unknowns", "concerns"],
  successCriteria: [
    "success criteria",
    "success",
    "success metric",
    "success metrics",
    "definition of done",
    "acceptance",
    "acceptance criteria",
    "kpis",
    "kpi",
  ],
};

const lookup = new Map<string, CanonicalSection>();
for (const [canonical, as] of Object.entries(aliases) as Array<[CanonicalSection, string[]]>) {
  for (const alias of as) lookup.set(normalize(alias), canonical);
}

export function matchSection(heading: string): CanonicalSection | null {
  const n = normalize(heading);
  if (lookup.has(n)) return lookup.get(n)!;
  for (const [key, canonical] of lookup) {
    if (n.includes(key) || key.includes(n)) return canonical;
  }
  return null;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
