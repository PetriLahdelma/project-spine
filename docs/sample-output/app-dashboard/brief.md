---
name: "Northstar Ops Dashboard"
projectType: "app-dashboard"
---

# Project brief

## Goals
- Ship a role-aware operations dashboard for support leads within 8 weeks.
- Reduce manual queue triage by surfacing priority accounts and stale cases.
- Give managers exportable weekly metrics without ad-hoc SQL requests.

## Audience
- Support leads who rebalance queues several times per day.
- Operations managers who review response times and escalation quality weekly.
- Workspace admins who invite agents and assign roles.

## Constraints
- Stack is Next.js app router with server actions for mutations.
- Auth comes from the existing SSO provider; no new identity system in v1.
- Tables may include customer names and emails, so analytics and logs must not contain PII.

## Assumptions
- Workspaces stay under 200 active agents during the beta.
- The existing API can provide queue and user data with p95 under 300ms.

## Risks
- Large exports could block the UI unless moved to a background job.
- Permission mistakes are more damaging than missing convenience features.

## Success criteria
- New support lead reaches the default queue view in under 2 minutes.
- Role-gated routes deny access with a clear recovery path.
- Queue table handles 10,000 rows through server-side pagination.
