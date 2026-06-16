# Component plan

> How components are organized and how agents should extend them.

_Generated from `spine.json` — hash `6314a0c307118ea7`, project type `app-dashboard`._

<!-- spine:deterministic -->

## Buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Usage guidance

- AppShell — Sidebar + TopBar + main content area; handles collapsed/expanded states. <sup>`template:template:app-dashboard/contributes#0`</sup>
- Sidebar — Nav with role-gated items; keyboard and screen-reader navigable. <sup>`template:template:app-dashboard/contributes#1`</sup>
- TopBar — Search, notifications, user menu. <sup>`template:template:app-dashboard/contributes#2`</sup>
- DataTable — Sortable, paginated, keyboard-navigable; supports row selection. <sup>`template:template:app-dashboard/contributes#3`</sup>
- EmptyState — First-run / no-data copy with suggested next action. <sup>`template:template:app-dashboard/contributes#4`</sup>
- FormDialog — Consistent modal with focus trap and escape-to-close. <sup>`template:template:app-dashboard/contributes#5`</sup>
- PermissionGate — Hides or disables UI based on the current user's role. <sup>`template:template:app-dashboard/contributes#6`</sup>

## UX rules

- Every data surface has explicit loading, empty, error, and partial states. <sup>`inference:inferred:dashboard/states`</sup>
- Destructive actions require confirmation and always present an undo path when feasible. <sup>`template:template:app-dashboard/contributes#0`</sup>
- Bulk operations show progress and a cancel affordance. <sup>`template:template:app-dashboard/contributes#1`</sup>
