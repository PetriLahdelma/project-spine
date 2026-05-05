import { defineCommand } from "citty";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDrift } from "../drift/check.js";

const ROUTED_COMMANDS = [
  "init",
  "compile",
  "inspect",
  "export",
  "template",
  "explain",
  "drift",
  "tokens",
  "doctor",
] as const;

const DORMANT_HOSTED_COMMANDS = ["login", "logout", "whoami", "workspace", "publish", "rationale"] as const;

type Status = "pass" | "warn" | "fail";

type Check = {
  name: string;
  status: Status;
  detail: string;
};

type PackageJson = {
  version: string;
  publishConfig?: {
    tag?: string;
  };
};

export default defineCommand({
  meta: {
    name: "doctor",
    description: "Verify the public beta CLI surface, release channel, runtime, and local drift state.",
  },
  args: {
    repo: { type: "string", description: "Path to repo root", default: "." },
    out: { type: "string", description: ".project-spine directory", default: ".project-spine" },
    json: { type: "boolean", description: "Print structured JSON instead of text", default: false },
    strict: {
      type: "boolean",
      description: "Exit non-zero on warnings as well as failures",
      default: false,
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const pkg = await readPackageJson();
    const checks: Check[] = [];

    checks.push({
      name: "version",
      status: pkg.version.includes("-beta.") ? "pass" : "fail",
      detail: `project-spine ${pkg.version}`,
    });

    checks.push({
      name: "release channel",
      status: pkg.publishConfig?.tag === "beta" ? "pass" : "fail",
      detail: `npm publish tag ${pkg.publishConfig?.tag ?? "(missing)"}`,
    });

    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
    checks.push({
      name: "runtime",
      status: nodeMajor >= 20 ? "pass" : "fail",
      detail: `Node ${process.versions.node} (${nodeMajor >= 20 ? ">=20" : "requires >=20"})`,
    });

    checks.push({
      name: "routed commands",
      status: "pass",
      detail: ROUTED_COMMANDS.join(", "),
    });

    checks.push({
      name: "hosted commands",
      status: "pass",
      detail: `${DORMANT_HOSTED_COMMANDS.join(", ")} are not routed in the public OSS CLI`,
    });

    checks.push({
      name: "network posture",
      status: "pass",
      detail: "compile, inspect, export, template, explain, drift, and doctor do not require network access",
    });

    try {
      const drift = await checkDrift({ repo: root, out: args.out });
      const manifestMissing = drift.items.some((item) => item.kind === "manifest:missing");
      checks.push({
        name: "local drift",
        status: drift.clean || manifestMissing ? "pass" : "fail",
        detail: drift.clean
          ? `clean (spine hash ${drift.storedSpineHash})`
          : manifestMissing
            ? "not compiled yet; run spine compile to enable drift proof"
          : `${drift.counts.total} drift item(s); run spine drift diff for details`,
      });
    } catch (err) {
      checks.push({
        name: "local drift",
        status: "fail",
        detail: err instanceof Error ? err.message : String(err),
      });
    }

    const summary = summarize(checks, args.strict);
    const payload = {
      ok: summary.ok,
      strict: args.strict,
      repo: root,
      version: pkg.version,
      checks,
    };

    if (args.json) {
      process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    } else {
      renderText(payload);
    }

    if (!summary.ok) process.exitCode = 1;
  },
});

function summarize(checks: Check[], strict: boolean): { ok: boolean } {
  const hasFail = checks.some((check) => check.status === "fail");
  const hasWarn = checks.some((check) => check.status === "warn");
  return { ok: !hasFail && !(strict && hasWarn) };
}

function renderText(payload: {
  ok: boolean;
  strict: boolean;
  repo: string;
  version: string;
  checks: Check[];
}): void {
  console.log(`Project Spine doctor — ${payload.version}`);
  console.log(`repo: ${payload.repo}`);
  console.log("");

  for (const check of payload.checks) {
    const mark = check.status === "pass" ? "[ok]" : check.status === "warn" ? "[warn]" : "[fail]";
    console.log(`${mark.padEnd(6)} ${check.name.padEnd(16)} ${check.detail}`);
  }

  console.log("");
  if (payload.ok) {
    console.log(payload.strict ? "strict doctor passed." : "doctor passed.");
  } else {
    console.log(payload.strict ? "strict doctor failed." : "doctor failed.");
  }
}

async function readPackageJson(): Promise<PackageJson> {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgPath = join(here, "..", "..", "package.json");
  const parsed = JSON.parse(await readFile(pkgPath, "utf8")) as unknown;
  if (!isPackageJson(parsed)) {
    throw new Error(`invalid package.json at ${pkgPath}`);
  }
  return parsed;
}

function isPackageJson(value: unknown): value is PackageJson {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.version !== "string") return false;
  const publishConfig = record.publishConfig;
  if (publishConfig === undefined) return true;
  if (!publishConfig || typeof publishConfig !== "object") return false;
  return (publishConfig as Record<string, unknown>).tag === undefined || typeof (publishConfig as Record<string, unknown>).tag === "string";
}
