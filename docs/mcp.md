# MCP server (`spine-mcp`)

Project Spine ships with an MCP (Model Context Protocol) server so any MCP-speaking client — Claude Code, Cursor, Continue, or anything else — can drive the CLI without the user switching terminals.

The server is distributed in the same npm package as the CLI. Install once and you get both binaries on `PATH`:

```bash
npm install -g project-spine@beta
which spine spine-mcp
```

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
      "command": "spine-mcp"
    }
  }
}
```

Restart Claude Code. The tools appear as `mcp__project-spine__spine_compile`, etc.

If `spine-mcp` isn't on `PATH` (e.g. a managed Node install), use the absolute path:

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
      "command": "spine-mcp"
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
      { "transport": { "type": "stdio", "command": "spine-mcp" } }
    ]
  }
}
```

### Any other stdio-MCP client

The server uses the standard MCP stdio transport. `command: "spine-mcp"` with no arguments works everywhere.

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
The CLI bundle is missing. Reinstall: `npm install -g project-spine@beta`.

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
