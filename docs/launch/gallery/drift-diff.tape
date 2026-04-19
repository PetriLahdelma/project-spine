# PH gallery slot 3 — drift diff terminal
#
# Regenerate: vhs docs/launch/gallery/drift-diff.tape
# Requires `spine` on PATH (npm install -g project-spine@next).

Output docs/launch/gallery/drift-diff.gif

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
Type `echo '' >> AGENTS.md && echo '# hand edit' >> AGENTS.md`
Enter
Type `clear`
Enter
Show

Sleep 500ms

Type `spine drift diff`
Sleep 200ms
Enter
Sleep 3.5s
