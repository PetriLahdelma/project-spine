#!/bin/bash
# Gallery slot 4 — generated files, captured inside real Ghostty
set -e
export PATH="/Users/petrilahdelma/.nvm/versions/node/v20.19.2/bin:$PATH"
WORK=$(mktemp -d)
cd "$WORK"
spine init --template saas-marketing >/dev/null 2>&1
printf '{"name":"acme","dependencies":{"next":"14.0.0"}}' > package.json
mkdir -p app && printf '{"compilerOptions":{"strict":true}}' > tsconfig.json
spine compile --brief ./brief.md --repo . --template saas-marketing >/dev/null 2>&1
clear
echo '# tool-discovery files (Claude Code / Cursor / Copilot read these)'
ls -1 AGENTS.md CLAUDE.md .github/copilot-instructions.md .cursor/rules/project-spine.mdc
echo
echo '# full compiled layer'
ls -1 .project-spine/exports/
