export const SITE = "https://projectspine.dev";
export const PROJECT_SPINE_VERSION = process.env["NEXT_PUBLIC_PROJECT_SPINE_VERSION"] ?? "0.9.2-beta.1";

export const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";
export const GOOGLE_ANALYTICS = {
  provider: "Google Analytics",
  streamName: "Project Spine",
  streamUrl: SITE,
  streamId: "15010753552",
  measurementId: "G-PGVBQ7SHQC",
} as const;
const AHREFS_PUBLIC_ID_PARTS = ["tHUVDMNNEe0D", "b2ff2cVtwQ"] as const;
export const AHREFS_ANALYTICS = {
  provider: "Ahrefs Web Analytics",
  scriptUrl: "https://analytics.ahrefs.com/analytics.js",
  publicIdName: "data-key",
  publicId: AHREFS_PUBLIC_ID_PARTS.join(""),
} as const;
export const GOOGLE_ANALYTICS_OBSERVABILITY = {
  mcp: {
    name: "analytics-mcp",
    status: "official_experimental_read_only",
    package: "analytics-mcp",
    command: "pipx",
    args: ["run", "analytics-mcp"],
    repository: "https://github.com/googleanalytics/google-analytics-mcp",
    docs: "https://developers.google.com/analytics/devguides/MCP",
  },
  requiredPrivateConfig: [
    {
      name: "ga4PropertyId",
      env: "GA4_PROPERTY_ID",
      classification: "private_identifier",
      requiredFor: ["run_report", "run_realtime_report", "run_funnel_report"],
      note: "Numeric GA4 property ID, not the public G- measurement ID and not the stream ID.",
    },
    {
      name: "applicationDefaultCredentials",
      env: "GOOGLE_APPLICATION_CREDENTIALS",
      classification: "secret_path",
      requiredFor: ["analytics-mcp"],
      note: "Path to local Google Application Default Credentials with analytics.readonly scope. Do not publish the file or token contents.",
    },
    {
      name: "googleCloudProject",
      env: "GOOGLE_PROJECT_ID",
      classification: "private_identifier",
      requiredFor: ["analytics-mcp"],
      note: "Google Cloud project with Google Analytics Admin API and Google Analytics Data API enabled.",
    },
  ],
  usefulMcpTools: [
    "get_account_summaries",
    "get_property_details",
    "run_report",
    "run_realtime_report",
    "run_funnel_report",
    "get_custom_dimensions_and_metrics",
  ],
  suggestedPrompts: [
    "Use get_account_summaries to find the Project Spine GA4 property ID.",
    "Run a realtime report for activeUsers by eventName for the Project Spine property.",
    "Run a 7-day report for activeUsers, sessions, screenPageViews, and eventCount by pagePath.",
    "Filter reports to streamId 15010753552 when validating the projectspine.dev web stream.",
  ],
} as const;

export const AGENT_LINK_HEADER = [
  '</llms.txt>; rel="alternate"; type="text/markdown"; title="Project Spine llms.txt"',
  '</index.md>; rel="alternate"; type="text/markdown"; title="Project Spine homepage markdown"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/site-analytics.json>; rel="service-meta"; type="application/json"; title="Project Spine public analytics metadata"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
  '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"; title="Project Spine MCP server card"',
  '</.well-known/oauth-protected-resource>; rel="service-meta"; type="application/json"; title="Project Spine OAuth protected resource metadata"',
].join(", ");

export const WELL_KNOWN_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

export const HOME_MARKDOWN = `---
title: Project Spine
description: Keep reviewed corrections as evidence-backed repository guardrails.
image: ${SITE}/opengraph-image
---

# Project Spine

Project Spine is a local, deterministic learning loop for repositories. It
captures reviewed failures as explicit evidence, records maintainer-authored literal
guardrails, verifies them against recorded Git history, and makes verified
rules available to CI and coding agents.

The source-available correction pilot preserves user-reviewed, dependency-free
JavaScript \`node:test\` bytes plus an explicit source-file list. It pairs the
same reviewed test with each revision's own source in constrained, digest-pinned
Docker containers. Linux and macOS with local Docker are supported. Check the
release's distribution status before assuming npm availability.

## Beta source build

\`\`\`bash
git clone --branch main https://github.com/PetriLahdelma/project-spine.git
cd project-spine && npm ci && npm run build
node dist/cli.js demo
\`\`\`

## Core commands

- \`spine learn --case failure.json\` imports explicit local evidence.
- \`spine replay <case-id>\` checks a rule against broken and corrected commits.
- \`spine guard --diff HEAD~1 --json\` evaluates verified rules on a diff.
- \`spine context --files 'src/a.ts'\` returns relevant verified rules.
- \`spine report --format html --out report.html\` writes a local report.
- \`spine demo\` creates and runs the synthetic tenant-query fixture.
- \`spine evaluate <case-id> --adapter adapter.json --allow-execution --runs 1 --json\`
  optionally executes a configured evaluator in temporary clones; it has no OS
  sandbox and may use the network or incur model costs.
- Existing compile and drift commands remain supported.

## Agent surfaces

Project Spine publishes agent-readable discovery documents:

- \`${SITE}/llms.txt\`
- \`${SITE}/auth.md\`
- \`${SITE}/.well-known/api-catalog\`
- \`${SITE}/.well-known/site-analytics.json\`
- \`${SITE}/.well-known/mcp/server-card.json\`
- \`${SITE}/.well-known/agent-skills/index.json\`

The source build includes \`spine-mcp\`, a stdio MCP server that exposes learning,
replay, guard, context, report, compile, doctor, drift, init, and tokens workflows.

## Project guarantees

- MIT-licensed OSS CLI.
- No telemetry, account, or implicit network call on compile paths.
- Node 22 or newer.
- Read-only Git-object replay; no checkout or agent rerun.
- Deterministic require-text and forbid-text rules scoped by file globs.
- No claim that a verified rule prevents every future variation of a defect.

## Canonical links

- Homepage: ${SITE}
- Documentation: ${SITE}/docs
- Product overview: ${SITE}/product
- Changelog: ${SITE}/changelog
- Security: ${SITE}/security
- Public analytics metadata: ${SITE}/.well-known/site-analytics.json
- GitHub: https://github.com/PetriLahdelma/project-spine
`;

export const LLMS_TXT = `# Project Spine

> Local repository-learning CLI that turns reviewed failures into scoped,
> historically verified literal guardrails for CI and coding agents.

Project Spine is an offline-first Node/TypeScript CLI. It records explicit
failure evidence, verifies literal rules against Git objects, checks diffs in
CI, and serves file-relevant context through a local MCP server. Its existing
compile and drift surfaces remain available.

The source-available correction pilot is a separate executable path for reviewed,
dependency-free JavaScript \`node:test\` bytes and explicit source files. It
requires local Docker on Linux/macOS and explicit execution consent. Check each
release's distribution status for npm availability. No-execution correction
context is always candidate; successful controls return verified guidance.

## Important URLs

- Homepage: ${SITE}
- Docs: ${SITE}/docs
- Product: ${SITE}/product
- Changelog: ${SITE}/changelog
- Security: ${SITE}/security
- GitHub repository: https://github.com/PetriLahdelma/project-spine
- Current npm beta (compile-first): https://www.npmjs.com/package/project-spine
- MCP setup: https://github.com/PetriLahdelma/project-spine/blob/main/docs/mcp.md

## Agent discovery

- Markdown homepage: ${SITE}/index.md
- Auth guidance: ${SITE}/auth.md
- OAuth protected resource metadata: ${SITE}/.well-known/oauth-protected-resource
- API catalog: ${SITE}/.well-known/api-catalog
- Public analytics metadata: ${SITE}/.well-known/site-analytics.json
- MCP server card: ${SITE}/.well-known/mcp/server-card.json
- Agent skills index: ${SITE}/.well-known/agent-skills/index.json

## Forthcoming beta source build

\`\`\`bash
git clone --branch main https://github.com/PetriLahdelma/project-spine.git
cd project-spine && npm ci && npm run build
node dist/cli.js demo
\`\`\`

## Use this when

- You want to retain a reviewed failure as explicit repository evidence.
- You need to verify a literal rule against broken and corrected commits.
- You want deterministic CI checks and file-relevant context for coding agents.
- You still use the existing compile and drift workflows.

## Do not assume

- Do not upload a repository to Project Spine. The OSS CLI is local by default.
- Do not describe replay as rerunning an AI agent; it reads Git objects.
- Do not treat a passing replay as a universal prevention guarantee.
- Do not run \`spine evaluate\` without explicit execution consent and a reviewed
  adapter. It executes configured programs and is separate from replay.
- Do not call hosted workspace flows unless the user explicitly configured the
  dormant hosted beta.
- Do not edit generated exports by hand without running \`spine drift check\`
  and deciding whether to recompile or preserve local blocks.
`;

export const AUTH_MD = `# auth.md

Project Spine does not currently issue agent credentials or API keys.

## Agent registration

Registration required: no for the public OSS CLI and local stdio MCP server.

- Supported flow: public_oss_no_registration
- register_uri: not applicable; Project Spine does not issue autonomous agent
  accounts.
- identity_types_supported: none for the public CLI and local MCP server.
- credential_types_supported: none for the public CLI and local MCP server.
- claim_uri: not applicable; there is no OTP claim ceremony for local use.
- revocation_uri: not applicable; no reusable agent credential is issued.
- agent_auth: no hosted agent_auth block is published because agent OAuth
  registration is not available.

Agents should install the package, run it locally, and use the current user's
filesystem and Git permissions. Do not attempt autonomous hosted account
creation.

## Step 1 - Discover

Fetch this file and the protected resource metadata:

- auth.md: ${SITE}/auth.md
- OAuth Protected Resource Metadata:
  ${SITE}/.well-known/oauth-protected-resource

The metadata intentionally advertises no authorization_servers and no
scopes_supported for agent use. The public CLI and stdio MCP server are local
tools, not hosted protected APIs.

## Step 2 - Pick a method

Use public_oss_no_registration for Project Spine agent workflows. Do not choose
identity_assertion, anonymous registration, user claimed OTP, or agent verified
registration; Project Spine does not support those flows yet.

## Step 3 - Register

No registration request is required. There is no register_uri, client_id,
client_secret, API key, access_token, or refresh_token for public CLI or local
MCP usage.

## Step 4 - Claim ceremony

No claim email, OTP, or claim_uri exists for local use. Hosted workspaces use a
human GitHub OAuth browser session and are not available for autonomous agent
registration.

## Step 5 - Use the credential

There is no issued credential. Agents should invoke the local CLI or stdio MCP
server under the current operating-system user and inherit that user's
filesystem and Git permissions.

## Errors

- registration_not_required: install the package and run the CLI locally.
- hosted_agent_registration_unavailable: do not attempt hosted account creation.
- unsupported_credential_type: API keys and bearer tokens are not issued for
  public CLI or local MCP use.

## Revocation

Because no reusable agent credential is issued, there is no revocation_uri.
Remove the package, delete the MCP client configuration, or revoke the human
GitHub OAuth grant for hosted workspace sessions.

## Public OSS CLI

No service account is required for the public CLI:

\`\`\`bash
git clone --branch main https://github.com/PetriLahdelma/project-spine.git
cd project-spine && npm ci && npm run build
node dist/cli.js demo
\`\`\`

The learning, replay, guard, context, report, compile, inspect, export, drift,
template, and doctor flows run locally. The current npm beta provides the
compile-first surface; the repository-learning beta is available from source
until its matching release is published.

## MCP clients

Install the package once, then configure the stdio MCP server:

\`\`\`json
{
  "mcpServers": {
    "project-spine": {
      "command": "spine-mcp"
    }
  }
}
\`\`\`

The MCP server has no hosted credential exchange. It shells out to the local
\`spine\` binary and works against the repository path the client provides.

## Hosted workspace beta

The hosted workspace surface at projectspine.dev uses human GitHub OAuth
sessions. Agent registration, OAuth token issuance for agents, and Auth.md
claim flows are not available yet.

## Scopes

- Public CLI: no scopes.
- Local MCP: filesystem access is controlled by the MCP client and current user.
- Hosted workspace beta: human session only.

## Contact

Questions: support@projectspine.dev
Security: security@projectspine.dev
`;

export const PROJECT_SPINE_SKILL = `---
name: project-spine
description: Use when a user wants to retain reviewed repository failures as verified literal guardrails, route relevant context to coding agents, or use deterministic compile and drift workflows.
---

# Project Spine

Project Spine captures reviewed failures as explicit evidence, verifies scoped
literal rules against Git history, and routes verified context to coding agents.
Its deterministic compile and drift workflows remain supported.

## Install check

\`\`\`bash
spine --version
spine doctor --strict
\`\`\`

For the repository-learning beta:

\`\`\`bash
git clone --branch main https://github.com/PetriLahdelma/project-spine.git
cd project-spine && npm ci && npm run build
node dist/cli.js demo
\`\`\`

## Common flows

- Learn: import an explicit case with \`spine learn --case failure.json\`.
- Verify: run \`spine replay <case-id>\` against recorded Git refs.
- Enforce: run \`spine guard --diff HEAD~1 --json\` in CI.
- Route context: run \`spine context --files 'src/a.ts'\` or use MCP.
- Existing project context: compile and drift commands remain available.
- MCP client setup: use \`spine-mcp\` as a stdio server.

## Guardrails

- Keep learning, replay, guard, context, report, and compile paths local unless
  the user explicitly opts into a networked command.
- Treat replay as evidence for literal rules, not as an agent rerun or a
  universal prevention guarantee.
- Prefer updating \`brief.md\`, templates, or design rules before hand-editing
  generated agent files.
- Always report the exact command and result used to verify drift, typecheck,
  or tests.
`;

export function markdownForPath(pathname: string): string | null {
  if (pathname === "/" || pathname === "/index.md") return HOME_MARKDOWN;
  if (pathname === "/llms.txt") return LLMS_TXT;
  if (pathname === "/auth.md") return AUTH_MD;
  return null;
}

export function markdownHeaders(body: string): Record<string, string> {
  return {
    ...WELL_KNOWN_HEADERS,
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Signal": CONTENT_SIGNAL,
    Vary: "Accept",
    "x-markdown-tokens": String(estimateTokenCount(body)),
  };
}

export function markdownResponse(body: string): Response {
  return new Response(body, { headers: markdownHeaders(body) });
}

export function jsonResponse(body: unknown, contentType = "application/json; charset=utf-8"): Response {
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: {
      ...WELL_KNOWN_HEADERS,
      "Content-Type": contentType,
      "Content-Signal": CONTENT_SIGNAL,
    },
  });
}

export function textResponse(body: string, contentType = "text/plain; charset=utf-8"): Response {
  return new Response(body, {
    headers: {
      ...WELL_KNOWN_HEADERS,
      "Content-Type": contentType,
      "Content-Signal": CONTENT_SIGNAL,
    },
  });
}

export async function agentSkillsIndex(): Promise<Record<string, unknown>> {
  const digest = await sha256Digest(PROJECT_SPINE_SKILL);
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "project-spine",
        type: "skill-md",
        description:
          "Use when an agent needs to install Project Spine, compile repo-native agent instructions, run drift checks, or configure the spine-mcp stdio server.",
        url: `${SITE}/.well-known/agent-skills/project-spine/SKILL.md`,
        digest,
      },
    ],
  };
}

export function apiCatalog(): Record<string, unknown> {
  return {
    linkset: [
      {
        anchor: SITE,
        "service-doc": [
          { href: `${SITE}/docs`, type: "text/html", title: "Project Spine documentation" },
          { href: `${SITE}/index.md`, type: "text/markdown", title: "Project Spine homepage as Markdown" },
        ],
        "service-desc": [
          {
            href: `${SITE}/.well-known/mcp/server-card.json`,
            type: "application/json",
            title: "Project Spine MCP server card",
          },
          {
            href: `${SITE}/.well-known/agent-skills/index.json`,
            type: "application/json",
            title: "Project Spine Agent Skills index",
          },
          {
            href: `${SITE}/.well-known/site-analytics.json`,
            type: "application/json",
            title: "Project Spine public analytics metadata",
          },
        ],
        item: [
          { href: `${SITE}/api/health`, type: "application/json", title: "Public health endpoint" },
          { href: `${SITE}/llms.txt`, type: "text/markdown", title: "LLM-oriented site map" },
          { href: `${SITE}/auth.md`, type: "text/markdown", title: "Agent authentication guidance" },
        ],
      },
      {
        anchor: `${SITE}/api/health`,
        "service-doc": [{ href: `${SITE}/security`, type: "text/html", title: "Security posture" }],
        status: [{ href: `${SITE}/api/health`, type: "application/json", title: "Health check" }],
      },
    ],
  };
}

export function publicAnalyticsMetadata(): Record<string, unknown> {
  return {
    $schema: `${SITE}/schemas/public-site-analytics.v1.json`,
    schemaVersion: 1,
    kind: "public_site_analytics_metadata",
    site: {
      name: "Project Spine",
      url: SITE,
    },
    analytics: {
      provider: `${GOOGLE_ANALYTICS.provider} + ${AHREFS_ANALYTICS.provider}`,
      purpose: "aggregate_public_website_measurement",
      stream: {
        name: GOOGLE_ANALYTICS.streamName,
        url: GOOGLE_ANALYTICS.streamUrl,
        id: GOOGLE_ANALYTICS.streamId,
        measurementId: GOOGLE_ANALYTICS.measurementId,
      },
      additionalProviders: [
        {
          provider: AHREFS_ANALYTICS.provider,
          scriptUrl: AHREFS_ANALYTICS.scriptUrl,
          publicIdName: AHREFS_ANALYTICS.publicIdName,
          publicId: AHREFS_ANALYTICS.publicId,
        },
      ],
      observability: GOOGLE_ANALYTICS_OBSERVABILITY,
    },
    security: {
      classification: "public_identifier",
      containsSecrets: false,
      credential: false,
      safeForAgentsToRead: true,
      handling:
        "These identifiers are public analytics configuration, not API keys, bearer tokens, client secrets, or refresh tokens.",
    },
    privacy: {
      cliTelemetry: false,
      repoDataUploadedThroughAnalytics: false,
      sourceCodeUploadedThroughAnalytics: false,
      documentation: `${SITE}/privacy`,
    },
    updated: "2026-06-16",
  };
}

export function publicAnalyticsMetadataSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${SITE}/schemas/public-site-analytics.v1.json`,
    title: "Project Spine public site analytics metadata",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "kind", "site", "analytics", "security", "privacy", "updated"],
    properties: {
      $schema: { type: "string", format: "uri" },
      schemaVersion: { const: 1 },
      kind: { const: "public_site_analytics_metadata" },
      site: {
        type: "object",
        additionalProperties: false,
        required: ["name", "url"],
        properties: {
          name: { type: "string" },
          url: { type: "string", format: "uri" },
        },
      },
      analytics: {
        type: "object",
        additionalProperties: false,
        required: ["provider", "purpose", "stream", "observability"],
        properties: {
          provider: { type: "string" },
          purpose: { const: "aggregate_public_website_measurement" },
          stream: {
            type: "object",
            additionalProperties: false,
            required: ["name", "url", "id", "measurementId"],
            properties: {
              name: { type: "string" },
              url: { type: "string", format: "uri" },
              id: { type: "string" },
              measurementId: { type: "string" },
            },
          },
          additionalProviders: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["provider", "scriptUrl", "publicIdName", "publicId"],
              properties: {
                provider: { type: "string" },
                scriptUrl: { type: "string", format: "uri" },
                publicIdName: { type: "string" },
                publicId: { type: "string" },
              },
            },
          },
          observability: {
            type: "object",
            additionalProperties: false,
            required: ["mcp", "requiredPrivateConfig", "usefulMcpTools", "suggestedPrompts"],
            properties: {
              mcp: {
                type: "object",
                additionalProperties: false,
                required: ["name", "status", "package", "command", "args", "repository", "docs"],
                properties: {
                  name: { type: "string" },
                  status: { const: "official_experimental_read_only" },
                  package: { type: "string" },
                  command: { type: "string" },
                  args: { type: "array", items: { type: "string" } },
                  repository: { type: "string", format: "uri" },
                  docs: { type: "string", format: "uri" },
                },
              },
              requiredPrivateConfig: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "env", "classification", "requiredFor", "note"],
                  properties: {
                    name: { type: "string" },
                    env: { type: "string" },
                    classification: { enum: ["private_identifier", "secret_path"] },
                    requiredFor: { type: "array", items: { type: "string" } },
                    note: { type: "string" },
                  },
                },
              },
              usefulMcpTools: { type: "array", items: { type: "string" } },
              suggestedPrompts: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      security: {
        type: "object",
        additionalProperties: false,
        required: ["classification", "containsSecrets", "credential", "safeForAgentsToRead", "handling"],
        properties: {
          classification: { const: "public_identifier" },
          containsSecrets: { const: false },
          credential: { const: false },
          safeForAgentsToRead: { const: true },
          handling: { type: "string" },
        },
      },
      privacy: {
        type: "object",
        additionalProperties: false,
        required: [
          "cliTelemetry",
          "repoDataUploadedThroughAnalytics",
          "sourceCodeUploadedThroughAnalytics",
          "documentation",
        ],
        properties: {
          cliTelemetry: { const: false },
          repoDataUploadedThroughAnalytics: { const: false },
          sourceCodeUploadedThroughAnalytics: { const: false },
          documentation: { type: "string", format: "uri" },
        },
      },
      updated: { type: "string", format: "date" },
    },
  };
}

export function mcpServerCard(): Record<string, unknown> {
  return {
    $schema: "https://modelcontextprotocol.io/schemas/server-card/v1.0",
    version: "1.0",
    protocolVersion: "2025-03-26",
    serverInfo: {
      name: "project-spine",
      version: PROJECT_SPINE_VERSION,
      description:
        "Local stdio MCP server for repository learning, relevant verified context, deterministic compilation, and drift checks.",
      websiteUrl: SITE,
      package: "project-spine",
    },
    transport: {
      type: "stdio",
      command: "spine-mcp",
      install: "Build the beta from source; see https://projectspine.dev/docs",
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
    },
    tools: [
      {
        name: "spine_learn",
        description: "Validate and store a reviewed failure-case JSON as an inactive candidate.",
        readOnly: false,
      },
      {
        name: "spine_replay",
        description: "Verify a candidate against broken and corrected Git revisions without running repository code.",
        readOnly: false,
      },
      {
        name: "spine_context",
        description: "Return verified guardrails relevant to a set of repository files.",
        readOnly: true,
      },
      {
        name: "spine_guard",
        description: "Evaluate verified literal guardrails against repository files or a diff.",
        readOnly: true,
      },
      {
        name: "spine_report",
        description: "Inspect repository learning evidence, provenance, verification, and current guard results.",
        readOnly: true,
      },
      {
        name: "spine_compile",
        description: "Compile a brief and repository into the Project Spine operating layer.",
        readOnly: false,
      },
      {
        name: "spine_doctor",
        description: "Verify local Project Spine CLI readiness.",
        readOnly: true,
      },
      {
        name: "spine_drift_check",
        description: "Check whether inputs or generated exports drifted since the last compile.",
        readOnly: true,
      },
      {
        name: "spine_drift_diff",
        description: "Return unified diffs for drifted generated exports.",
        readOnly: true,
      },
      {
        name: "spine_init",
        description: "Scaffold a starter brief from a bundled template.",
        readOnly: false,
      },
      {
        name: "spine_tokens_pull",
        description: "Explicitly pull configured design tokens for compile input.",
        readOnly: false,
      },
    ],
    resources: [{ uri: "spine://manifest", name: "Project Spine export manifest" }],
    authentication: { required: false },
    documentationUrl: `${SITE}/docs`,
    sourceUrl: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/mcp.md",
  };
}

export function oauthProtectedResourceMetadata(): Record<string, unknown> {
  return {
    resource: SITE,
    authorization_servers: [],
    scopes_supported: [],
    resource_documentation: `${SITE}/auth.md`,
  };
}

function estimateTokenCount(body: string): number {
  return Math.ceil(body.trim().split(/\s+/).length * 1.35);
}

async function sha256Digest(body: string): Promise<string> {
  const bytes = new TextEncoder().encode(body);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}
