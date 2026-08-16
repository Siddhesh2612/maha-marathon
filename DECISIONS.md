# MAHA Marathon — Architecture Decision Log

This file records why major technical decisions were made during the MAHA Marathon build. It is intentionally written as a living engineering log so future developers and stakeholders can understand the reasoning rather than seeing only the final code.

## ADR-001 — Use one Next.js codebase

**Decision:** Keep registration, dashboard and admin in one Next.js repository for the demo.

**Why:** The three interfaces belong to one product and share types, branding, database access and deployment configuration. A single repository reduces duplicate code and makes a one-day demo much faster to build and debug. Separate subdomains can still be mapped to the appropriate interface later without creating three unrelated systems.

**Trade-off:** A larger production team may later split applications if independent release cycles or scaling requirements justify it.

## ADR-002 — Use Supabase PostgreSQL as the system of record

**Decision:** Store participants, districts, roles and permissions in the existing Supabase project.

**Why:** PostgreSQL provides reliable relational constraints and transactions. Supabase additionally provides Auth, APIs and Realtime capabilities, avoiding the need to build those infrastructure layers from scratch during the demo phase.

**Trade-off:** This creates a managed-service dependency. The schema remains standard PostgreSQL, which reduces migration risk later.

## ADR-003 — Do not expose participant rows to the public browser

**Decision:** Row Level Security is enabled and the anonymous client is not given direct SELECT access to `registrations`.

**Why:** Participant records contain personal information such as names and mobile numbers. A public dashboard only needs aggregate statistics, not raw participant data.

**Implementation:** The public client calls `get_dashboard_stats()`, which returns aggregate counts only.

## ADR-004 — Register through a controlled database function

**Decision:** Registration uses the `register_participant()` PostgreSQL function instead of granting anonymous INSERT access directly to the table.

**Why:** This gives one controlled entry point for validation, district checks and Bib generation while keeping the registrations table protected by RLS.

**Trade-off:** Public registration endpoints can still be spammed. Before production we must add rate limiting, bot protection and OTP if required.

## ADR-005 — Generate Bib numbers inside PostgreSQL

**Decision:** Bib numbers are created within the same database transaction that creates the participant.

**Why:** Browser-generated counters can collide when multiple people register at the same time. Database-side generation lets us lock a district sequence during the transaction so two users do not receive the same Bib.

**Demo format:** `PUN-000001`, `NAG-000001`, `YAV-000001`.

**Production improvement:** Replace the current maximum-number lookup with a dedicated district counter table when traffic/load testing shows it is required.

## ADR-006 — Poll aggregate dashboard statistics every three seconds for demo

**Decision:** The demo dashboard refreshes aggregate stats every 3 seconds rather than subscribing directly to the registrations table through Realtime.

**Why:** A direct Realtime subscription would normally require the browser to have row visibility. We deliberately avoid exposing participant records. Three-second polling gives the meeting the desired live-count effect without weakening privacy.

**Production improvement:** Introduce a safe aggregate event/channel, materialized counters, or a server-side push mechanism if true sub-second updates become necessary.

## ADR-007 — Defer OTP until after the demo

**Decision:** Validate mobile number format now; integrate OTP later.

**Why:** OTP introduces an external SMS provider, credentials, delivery failure cases, cost and retry logic. It is not required to prove the core registration → database → dashboard pipeline tomorrow.

**Production requirement:** If the department approves OTP, select an approved SMS provider, add rate limits and OTP expiry/attempt rules, and never store plain OTP codes.

## ADR-008 — Prepare volunteer authorization tables before building the full UI

**Decision:** Create `profiles` and `volunteer_permissions` now, then wire them to Supabase Auth in the next milestone.

**Why:** Authorization affects database design. Preparing the data model early avoids later restructuring while allowing today's milestone to focus on the registration pipeline.

**Authorization model:** `admin` and `volunteer`, with optional district assignment and individual permission flags.

## ADR-009 — Use Vercel for the meeting demo

**Decision:** Deploy the Next.js demo to Vercel and connect the GoDaddy-managed domain.

**Why:** Vercel has first-class Next.js deployment and Git integration, which minimizes deployment work when the meeting deadline is one day away.

**Trade-off:** The free/demo deployment is not being presented as the final infrastructure for a state-scale government workload. Production architecture must be decided after traffic, procurement, security, data residency and availability requirements are confirmed.

## ADR-010 — Keep GoDaddy as DNS registrar, not application server

**Decision:** GoDaddy manages ownership/DNS for `mahamarathon.co.in`; Vercel serves the web application.

**Why:** A domain registrar and an application runtime solve different problems. DNS records point user-facing subdomains to the deployed application.

## ADR-011 — Keep the first demo vertically complete rather than feature-complete

**Decision:** Prioritize one working chain: registration → Bib → database → dashboard. Volunteer Auth comes immediately afterward; QR check-in and certificates are Phase 2.

**Why:** A reliable end-to-end workflow demonstrates architectural feasibility better than many disconnected mock screens.

## Next decisions to record

- Supabase Auth invitation/login strategy for administrators and volunteers.
- District-scoped RLS policies for volunteer participant search/check-in.
- GoDaddy DNS/subdomain routing strategy on Vercel.
- Master QR generation.
- Check-in endpoint and anti-duplicate attendance rules.
- Certificate generation/storage/verification architecture.
- Production rate limiting, observability, backups and load testing.
