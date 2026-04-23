#!/bin/bash
# Gallery slot 5 — Claude Code reading a compiled AGENTS.md
#
# Creates a freshly-Spine-compiled temp repo, then runs Claude Code in
# print-mode against it with a prompt that surfaces AGENTS.md content.
# Print mode renders in the terminal as a static transcript — good for
# a non-interactive screenshot.
set -e
export PATH="/Users/petrilahdelma/.nvm/versions/node/v20.19.2/bin:/Users/petrilahdelma/.local/bin:$PATH"

WORK=$(mktemp -d)
cd "$WORK"
spine init --template saas-marketing >/dev/null 2>&1
printf '{"name":"acme-payroll","dependencies":{"next":"14.0.0"}}' > package.json
mkdir -p app && printf '{"compilerOptions":{"strict":true}}' > tsconfig.json
spine compile --brief ./brief.md --repo . --template saas-marketing >/dev/null 2>&1

clear
# Show the prompt, then ask Claude — print mode keeps the output static
# so the terminal frame can be photographed cleanly.
echo 'acme-payroll $ claude -p "Read AGENTS.md and summarise what this project wants in 3 bullets."'
echo
claude -p "Read AGENTS.md in the current directory and summarise what this project wants in exactly 3 short bullets. Keep it under 60 words total. Start with 'Project wants to:'."
