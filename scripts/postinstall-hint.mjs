#!/usr/bin/env node
// Print a one-line hint on a **global** install of project-spine. Silent on
// transitive / local installs so this never shows up in someone else's
// devDependency chain.
//
// npm, pnpm, and yarn all set `npm_config_global` to the string "true" when
// the install was launched with `-g`/`--global`; anything else we treat as
// "not global, stay quiet".

if (process.env.npm_config_global !== "true") process.exit(0);

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const PINK = "\x1b[38;5;205m";
const RESET = "\x1b[0m";
const color = process.stdout.isTTY && process.env.NO_COLOR !== "1";

const hint = color
  ? `\n  ${PINK}spine${RESET} installed. ${BOLD}Next:${RESET} ${DIM}cd to a repo, then run${RESET} ${BOLD}spine init${RESET}.\n`
  : `\n  spine installed. Next: cd to a repo, then run \`spine init\`.\n`;

process.stdout.write(hint);
