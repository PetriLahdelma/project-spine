# Demo cast

`demo.tape` is a [VHS](https://github.com/charmbracelet/vhs) script that records a ~60-second canonical demo of `spine init` → `spine compile` → `spine drift check` → `spine drift diff` and produces `demo.gif`.

## Regenerate

```bash
brew install vhs     # or: go install github.com/charmbracelet/vhs@latest
vhs docs/demo/demo.tape
```

The `Output` directive at the top of the tape writes to `docs/demo/demo.gif`. Commit the GIF next to the tape and link from the main README when a fresh one is recorded.

## What the demo covers

1. `spine init --template saas-marketing` — scaffolds brief.md from a preset.
2. Edit the brief's project name.
3. `spine compile --brief ./brief.md --repo . --template saas-marketing` — produces the full 19-file output.
4. `ls` the tool-discovery files at repo root (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`).
5. Peek at `.project-spine/export-manifest.json` to show the hashed inventory.
6. Hand-edit `AGENTS.md` to demonstrate drift.
7. `spine drift check --fail-on any` → non-zero exit.
8. `spine drift diff` → unified patch of the edit.

Total runtime: ~55 seconds at the tape's typing speed. Final frame lands on the diff output so a static OG preview is legible.

## Re-recording etiquette

- Use a dedicated tmp working dir (the tape does this via `$(mktemp -d)`).
- Clear any existing `project-spine` global install first; this tape assumes the CLI is on PATH.
- Don't record any real credentials — the tape exercises the offline `compile` / `drift` path only. `spine tokens pull` is not demoed here because it requires `FIGMA_TOKEN`.
