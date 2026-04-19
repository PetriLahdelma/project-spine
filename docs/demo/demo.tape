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
#   - `project-spine` is installed globally (or aliased; the FakeCommand
#     below shows what to display if you prefer to mock without a real
#     install).
#   - A clean tmp working directory.
#   - Internet access (for GitHub releases via /changelog page only; the
#     compile step itself is offline).

Output docs/demo/demo.gif
Set FontSize 16
Set Width 1100
Set Height 700
Set Shell bash
Set TypingSpeed 35ms
Set Theme "Tokyo Night"
Set Padding 20

# Fresh working directory.
Hide
Type "cd $(mktemp -d) && clear"  Enter
Show

Sleep 700ms

# 1. Scaffold a brief from a template.
Type "spine init --template saas-marketing"  Sleep 300ms  Enter
Sleep 2.5s

# 2. Edit the generated brief.md (simulate with a cat + a prepared one-liner).
Hide
Type "sed -i '' 's/name: \"\"/name: \"Acme Payroll marketing site\"/' brief.md 2>/dev/null || sed -i 's/name: \"\"/name: \"Acme Payroll marketing site\"/' brief.md"  Enter
Type "clear"  Enter
Show

Type "# brief.md now carries a real project name"  Enter
Sleep 700ms

# 3. Compile against a minimal repo skeleton.
Hide
Type 'echo {\"name\":\"acme-payroll\",\"dependencies\":{\"next\":\"14.0.0\"}} > package.json && mkdir -p app && echo {\"compilerOptions\":{\"strict\":true}} > tsconfig.json'  Enter
Show

Type "spine compile --brief ./brief.md --repo . --template saas-marketing"  Sleep 300ms  Enter
Sleep 4s

# 4. Look at the tool-discovery files at repo root.
Type "ls AGENTS.md CLAUDE.md .github/copilot-instructions.md"  Sleep 200ms  Enter
Sleep 1.5s

# 5. Show the hashed manifest.
Type "cat .project-spine/export-manifest.json | head -12"  Sleep 200ms  Enter
Sleep 2s

# 6. Hand-edit one export to demonstrate drift detection.
Type "echo \"\\n<!-- hand-edited -->\" >> AGENTS.md"  Sleep 200ms  Enter
Sleep 600ms

Type "spine drift check --fail-on any; echo exit=$?"  Sleep 200ms  Enter
Sleep 2.5s

# 7. See exactly WHAT drifted.
Type "spine drift diff"  Sleep 200ms  Enter
Sleep 3s

# Hold on the final frame so the GIF lands on the diff output.
Sleep 2s
