# Project Spine — 60-second demo tape
#
# Regenerate the GIF with VHS (https://github.com/charmbracelet/vhs):
#
#   brew install vhs
#   vhs docs/demo/demo.tape
#
# Produces docs/demo/demo.gif. Commit the GIF + link from README.
#
# Tape assumes:
#   - `project-spine` is installed globally (or aliased).
#   - A clean tmp working directory.
#   - Offline; no credentials needed.
#
# Quoting rule: VHS `Type "..."` does NOT process escaped double-quotes.
# For any command that needs literal " inside the typed text, use backtick
# strings (`...`) instead — VHS parses them as literal.

Output docs/demo/demo.gif
Set FontSize 16
Set Width 1100
Set Height 700
Set Shell bash
Set TypingSpeed 35ms
Set Theme "TokyoNight"
Set Padding 20

# Fresh working directory.
Hide
Type `cd $(mktemp -d) && clear`
Enter
Show

Sleep 700ms

# 1. Scaffold a brief from a template.
Type "spine init --template saas-marketing"
Sleep 300ms
Enter
Sleep 2.5s

# 2. Seed a minimal repo skeleton so the compile has something to analyse.
Hide
Type `printf '{"name":"acme-payroll","dependencies":{"next":"14.0.0"}}' > package.json`
Enter
Type "mkdir -p app"
Enter
Type `printf '{"compilerOptions":{"strict":true}}' > tsconfig.json`
Enter
Type "clear"
Enter
Show

Type "# Brief scaffolded, minimal repo skeleton in place."
Enter
Sleep 1s

# 3. Compile brief + repo + template into the full 19-file output.
Type "spine compile --brief ./brief.md --repo . --template saas-marketing"
Sleep 300ms
Enter
Sleep 4s

# 4. Show the tool-discovery files landed at repo root.
Type "ls AGENTS.md CLAUDE.md .github/copilot-instructions.md"
Sleep 200ms
Enter
Sleep 1.8s

# 5. Peek at the hashed manifest.
Type "head -12 .project-spine/export-manifest.json"
Sleep 200ms
Enter
Sleep 2.2s

# 6. Hand-edit one export.
Type "echo >> AGENTS.md"
Enter
Type "echo '# hand edit' >> AGENTS.md"
Enter
Sleep 600ms

# 7. Drift check fires non-zero on hand edits.
Type "spine drift check --fail-on any; echo exit=$?"
Sleep 200ms
Enter
Sleep 2.5s

# 8. Drift diff shows exactly WHAT changed.
Type "spine drift diff"
Sleep 200ms
Enter
Sleep 3s

# Hold on the final frame.
Sleep 2s
