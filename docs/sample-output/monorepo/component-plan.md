# Component plan

> How components are organized and how agents should extend them.

_Generated from `spine.json` — hash `5632a143e1b77025`, project type `monorepo`._

<!-- spine:deterministic -->

## Buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Usage guidance

- packages/* — internal libraries. Private by default; each exports a typed public surface via index.ts. <sup>`template:template:monorepo/contributes#0`</sup>
- apps/* — deployable targets. Depend on packages/, never the other way around. <sup>`template:template:monorepo/contributes#1`</sup>
- tools/* — repo-local scripts, codegens, CI helpers. Not published. <sup>`template:template:monorepo/contributes#2`</sup>
- BuildGraph — one root config (turbo.json, nx.json, or a root package.json scripts map) that declares task deps. Every script is reproducible from a clean clone. <sup>`template:template:monorepo/contributes#3`</sup>
- ChangeGate — affected-package detection for CI: only run the build / test / lint for packages that actually changed (or depend on a change). <sup>`template:template:monorepo/contributes#4`</sup>

## UX rules

- `tsconfig.json` at the repo root defines shared compiler options; package tsconfigs extend it and only add overrides. <sup>`template:template:monorepo/contributes#0`</sup>
- Naming: `@scope/utils`, `@scope/ui`, `@scope/config`. The scope prefix makes internal-vs-external explicit in every import. <sup>`template:template:monorepo/contributes#1`</sup>
- Each package has its own README explaining what it exports and the boundary with the rest of the repo. <sup>`template:template:monorepo/contributes#2`</sup>
