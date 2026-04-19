---
name: ""
projectType: "api-service"
---

# Project brief

## Goals
- <!-- e.g. Ship v1 of the billing API in 8 weeks -->
- <!-- e.g. Sub-100ms p95 latency on the read path -->
- <!-- e.g. One stable error envelope across every endpoint -->

## Audience
- <!-- Who consumes this API. Internal team, partner integrations, public developers -->
- <!-- What SDKs or client patterns they use (typed, codegen, curl) -->

## Constraints
- <!-- Framework (Fastify / Express / Hono / raw Node) + runtime (Node 20, Bun, Deno, Cloudflare Workers) -->
- <!-- Data store (Postgres / DynamoDB / Redis + ... ) and any managed constraints -->
- <!-- Auth model (OAuth / API keys / mTLS / session cookies) -->
- <!-- Compliance scope (PCI / HIPAA / GDPR region pinning) -->

## Assumptions
- <!-- e.g. Traffic stays under 500 rps for the alpha window -->
- <!-- e.g. Only internal consumers during v1 — public release is v2 -->

## Risks
- <!-- e.g. Upstream dependency SLA uncertain -->
- <!-- e.g. Schema drift between services during migration -->

## Success criteria
- <!-- Every endpoint documented in the OpenAPI / reference spec -->
- <!-- p95 latency budget met for read and write paths -->
- <!-- Error envelope coverage at 100% — no raw stack traces on the wire -->
- <!-- Integration tests cover the happy path + 4xx auth + 4xx validation + 5xx upstream-down -->
