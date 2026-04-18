#!/usr/bin/env bash
#
# Project Spine agent skills installer
#
# Symlinks every skill in this directory into your agent skill store so that
# Claude Code, Codex CLI, or Cursor can discover them.
#
# Usage:
#   ./install.sh                 # install into ~/.claude/skills
#   ./install.sh --codex         # also install into ~/.codex/skills
#   ./install.sh --dry-run       # print what would happen without touching disk
#   ./install.sh --target /path  # override target directory
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DRY_RUN=0
INSTALL_CODEX=0
CUSTOM_TARGET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --codex)
      INSTALL_CODEX=1
      shift
      ;;
    --target)
      CUSTOM_TARGET="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '3,12p' "$0"
      exit 0
      ;;
    *)
      echo "unknown option: $1" >&2
      exit 2
      ;;
  esac
done

targets=()
if [[ -n "$CUSTOM_TARGET" ]]; then
  targets+=("$CUSTOM_TARGET")
else
  targets+=("$HOME/.claude/skills")
  if [[ "$INSTALL_CODEX" -eq 1 ]]; then
    targets+=("$HOME/.codex/skills")
  fi
fi

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "dry-run: $*"
  else
    "$@"
  fi
}

link_one() {
  local src="$1"
  local dest="$2"
  if [[ -L "$dest" || -e "$dest" ]]; then
    echo "  skip (exists): $dest"
    return
  fi
  run ln -s "$src" "$dest"
  echo "  linked: $dest -> $src"
}

for target in "${targets[@]}"; do
  echo "installing into $target"
  run mkdir -p "$target"
  for skill_dir in "$SCRIPT_DIR"/project-spine*/; do
    [[ -d "$skill_dir" ]] || continue
    name="$(basename "$skill_dir")"
    link_one "$skill_dir" "$target/$name"
  done
done

echo
echo "done. restart your agent for skills to be picked up."
