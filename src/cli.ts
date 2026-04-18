#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { printBanner, TAGLINE } from "./ui/banner.js";

const main = defineCommand({
  meta: {
    name: "spine",
    version: "0.6.0-alpha.0",
    description: `Project Spine — ${TAGLINE}.`,
  },
  subCommands: {
    init: () => import("./commands/init.js").then((m) => m.default),
    compile: () => import("./commands/compile.js").then((m) => m.default),
    inspect: () => import("./commands/inspect.js").then((m) => m.default),
    export: () => import("./commands/export.js").then((m) => m.default),
    template: () => import("./commands/template.js").then((m) => m.default),
    explain: () => import("./commands/explain.js").then((m) => m.default),
    drift: () => import("./commands/drift.js").then((m) => m.default),
    login: () => import("./commands/login.js").then((m) => m.default),
    logout: () => import("./commands/logout.js").then((m) => m.default),
    whoami: () => import("./commands/whoami.js").then((m) => m.default),
    workspace: () => import("./commands/workspace.js").then((m) => m.default),
    publish: () => import("./commands/publish.js").then((m) => m.default),
    rationale: () => import("./commands/rationale.js").then((m) => m.default),
  },
  run({ args }) {
    if ((args._?.length ?? 0) === 0) printBanner();
  },
});

runMain(main);
