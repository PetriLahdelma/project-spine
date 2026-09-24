# MCP server (`spine-mcp`)

The `0.10.0-beta.3` package includes the learning tools and both `spine` and
`spine-mcp` binaries. Pin the beta explicitly because npm's unqualified `latest`
tag still points to `0.9.2-beta.2`.

Project Spine ships with an MCP (Model Context Protocol) server so any MCP-speaking client — Claude Code, Cursor, Continue, or anything else — can drive the CLI without the user switching terminals.

Run the exact package without a persistent global install:

```bash
npx --yes --package=project-spine@0.10.0-beta.3 spine-mcp
```

The process speaks MCP over stdio, so it normally waits for a client rather than
printing interactive output. A global `npm install -g project-spine@0.10.0-beta.3`
also installs both binaries when a managed environment requires commands on
`PATH`.

## What it exposes

### Tools

| Name | Purpose | Read-only? |
|---|---|---|
| `spine_compile` | Compile brief + repo (+ optional tokens, template) into the 21-file operating layer. Writes to the filesystem. | No |
| `spine_doctor` | Verify package version, beta channel, Node runtime, routed CLI surface, hosted-command guardrails, network posture, and local drift state. | Yes |
| `spine_drift_check` | Check whether inputs or generated exports have changed since the last compile. Returns structured drift report. | Yes |
| `spine_drift_diff` | Unified diffs for each generated file that has been hand-edited since the last compile. | Yes |
| `spine_init` | Scaffold `brief.md` from a template. | No |
| `spine_tokens_pull` | Pull design tokens from Figma's Variables API. Enterprise-only on Figma's side. | No |

Tools that write files set `destructiveHint: true`; read-only tools set `readOnlyHint: true` and `idempotentHint: true`, so clients that respect annotations can auto-approve the safe calls.

### Resources

| URI | Contents |
|---|---|
| `spine://manifest` | The current working directory's `.project-spine/export-manifest.json` — SHA-256 hashes of every generated file, plus the last-compile timestamp. |

## Client setup

### Claude Code

Add an `mcpServers` entry to `~/.claude.json` (or the project-local `.claude/claude.json` if you prefer per-repo scope):

```json
{
  "mcpServers": {
    "project-spine": {
      "command": "npx",
      "args": ["--yes", "--package=project-spine@0.10.0-beta.3", "spine-mcp"]
    }
  }
}
```

Restart Claude Code. The tools appear as `mcp__project-spine__spine_compile`, etc.

If you deliberately use a global install and `spine-mcp` is not on `PATH`, use
its absolute path instead:

```json
{
  "mcpServers": {
    "project-spine": {
      "command": "/path/to/node/bin/spine-mcp"
    }
  }
}
```

### Cursor

Add to Cursor's `mcp.json`:

```json
{
  "mcpServers": {
    "project-spine": {
      "command": "npx",
      "args": ["--yes", "--package=project-spine@0.10.0-beta.3", "spine-mcp"]
    }
  }
}
```

### Continue

In `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["--yes", "--package=project-spine@0.10.0-beta.3", "spine-mcp"]
        }
      }
    ]
  }
}
```

### Any other stdio-MCP client

The server uses standard MCP stdio transport. Configure `npx` as the command and
`["--yes", "--package=project-spine@0.10.0-beta.3", "spine-mcp"]` as its arguments.

## Typical usage patterns

**Kickoff a new repo from chat.**

> "Scaffold a SaaS marketing brief here and compile it."

The agent calls `spine_init` then `spine_compile`. You get 21 generated files in a fresh repo without leaving the chat.

**Catch drift before you commit.**

> "Has anything drifted since the last compile?"

The agent calls `spine_drift_check`. If drift is detected, it follows up with `spine_drift_diff` to show exactly what changed — at which point you either accept the hand edits (and run `spine_compile` to re-baseline) or revert them.

**Inspect the manifest without touching files.**

> "Show me the export manifest."

The agent reads `spine://manifest` and summarizes. No tool call required; resource reads are free.

## Troubleshooting

**`Cannot find module .../dist/cli.js`**
The CLI bundle is missing. Reinstall the pinned beta:
`npm install -g project-spine@0.10.0-beta.3`.

**Tool calls hang or timeout**
Each call has a 2-minute hard cap. If `spine_compile` is legitimately slow, try `spine_compile` directly from a terminal once so the first-run warm-up (template expansion, repo scan) is cached.

**`spine_tokens_pull` returns 403**
Figma's Variables REST API is Enterprise-only as of 2026. The error body will confirm. Export tokens manually via the Tokens Studio plugin and pass `--tokens ./tokens.json` to `spine_compile` instead.

**The server starts but no tools appear in the client**
Check that the client is speaking the `2025-03-26` MCP protocol revision or newer. The SDK this server ships with is current as of `@modelcontextprotocol/sdk@^1.29`.

## Implementation notes

The server is a thin wrapper — each tool shells out to the sibling `spine` binary via `process.execPath`. This preserves CLI behavior 1:1, including error messages, exit codes, and output formatting. CLI flags with `--json` support (`doctor`, `drift check`, `drift diff`) round-trip their JSON payload as `structuredContent` on the tool response so clients that prefer structured data over text get it for free.

No Spine-specific state lives in the server; everything is derived from the cwd the client sends via `repoPath` (default `.`). Running two MCP clients against the same repo is safe; each call is a fresh process.

Source: [`src/mcp/server.ts`](../src/mcp/server.ts), [`src/mcp/spawn.ts`](../src/mcp/spawn.ts). Tests: [`src/mcp/server.test.ts`](../src/mcp/server.test.ts).
# Repository learning tools (0.10 beta)

The published `0.10.0-beta.3` package includes `spine_learn`, `spine_replay`,
`spine_guard`, `spine_context` and `spine_report` alongside the compiler tools
listed above. `spine_context` takes `repoPath` and a `files` array, and returns
only applicable verified rules.
`spine_guard` accepts the same optional file selection and reports violations or
missing coverage. `spine_learn` accepts `caseFile`; `spine_replay` accepts `caseId`;
`spine_report` accepts an optional `caseId`.

Learning and replay write local records but never execute repository scripts.
Guard, context and report are read-only. The optional executable evaluation adapter
is deliberately available through the CLI/library, not exposed as an MCP tool.
Treat rule descriptions, PR comments and source metadata as untrusted data.
