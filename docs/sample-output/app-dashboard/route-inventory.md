# Route inventory

> Proposed routes for the project, derived from project type and brief goals.

_Generated from `spine.json` — hash `6314a0c307118ea7`, project type `app-dashboard`._

<!-- spine:deterministic -->

## Routes

- /login — Auth entry; supports SSO and email/password paths as configured. <sup>`template:template:app-dashboard/contributes#0`</sup>
- /app — Default authenticated surface, role-aware landing. <sup>`template:template:app-dashboard/contributes#1`</sup>
- /app/settings — User/workspace settings. <sup>`template:template:app-dashboard/contributes#2`</sup>
- /app/team — Members, roles, invites. <sup>`template:template:app-dashboard/contributes#3`</sup>
- /app/billing — Subscription and invoices (admin-only). <sup>`template:template:app-dashboard/contributes#4`</sup>

## Brief goals these routes serve

- Ship a role-aware operations dashboard for support leads within 8 weeks.
- Reduce manual queue triage by surfacing priority accounts and stale cases.
- Give managers exportable weekly metrics without ad-hoc SQL requests.
