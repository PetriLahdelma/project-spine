# PH gallery slot 4 — generated file tree
#
# Regenerate: vhs docs/launch/gallery/tree.tape
# Requires `spine` on PATH (npm install -g project-spine@next).

Output docs/launch/gallery/tree.gif

Set FontSize 18
Set Width 1270
Set Height 760
Set Shell bash
Set TypingSpeed 28ms
Set Theme "Tomorrow Night"
Set Padding 28
Set Framerate 30

Hide
Type `export PATH="/Users/petrilahdelma/.nvm/versions/node/v20.19.2/bin:$PATH"`
Enter
Type `cd $(mktemp -d)`
Enter
Type `spine init --template saas-marketing >/dev/null 2>&1`
Enter
Type `printf '{"name":"acme-payroll","dependencies":{"next":"14.0.0"}}' > package.json`
Enter
Type `mkdir -p app && printf '{"compilerOptions":{"strict":true}}' > tsconfig.json`
Enter
Type `spine compile --brief ./brief.md --repo . --template saas-marketing >/dev/null 2>&1`
Enter
Type `clear`
Enter
Show

Sleep 500ms

Type `# tool-discovery files (Claude Code / Cursor / Copilot read these)`
Enter
Type `ls -1 AGENTS.md CLAUDE.md .github/copilot-instructions.md`
Sleep 200ms
Enter
Sleep 1.6s

Type `# full compiled layer`
Enter
Type `ls -1 .project-spine/exports/`
Sleep 200ms
Enter
Sleep 3s
