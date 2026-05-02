#!/bin/bash
# Gallery slot 3 — drift diff, captured inside real Ghostty
set -e
export PATH="/Users/petrilahdelma/.nvm/versions/node/v20.19.2/bin:$PATH"
WORK=$(mktemp -d)
cd "$WORK"
spine init --template saas-marketing >/dev/null 2>&1
printf '{"name":"acme-payroll","dependencies":{"next":"14.0.0"}}' > package.json
mkdir -p app && printf '{"compilerOptions":{"strict":true}}' > tsconfig.json
spine compile --brief ./brief.md --repo . --template saas-marketing >/dev/null 2>&1
echo '' >> AGENTS.md && echo '# hand edit' >> AGENTS.md
clear
spine drift diff
exec bash
