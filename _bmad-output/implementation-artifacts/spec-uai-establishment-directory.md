---
title: 'UAI-backed education establishment directory'
type: 'feature'
created: '2026-09-01'
status: 'in-review'
baseline_commit: 'dc7dfb09e2c9ed76a749c267aa8bcfa4be5413bc'
context:
  - '{project-root}/DEVELOPMENT-GUIDELINES.md'
  - '{project-root}/md/EPCT-WORKFLOW.md'
  - '{project-root}/md/supabase-best-pratice.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** SecuriClick currently mixes the official national directory with active SecuriClick tenants in `schools`. Search only prefills editable text and signup creates another school, so UAI identity, closure status, race safety, and official-data integrity are not guaranteed.

**Approach:** Introduce a non-personal `education_establishments` reference table keyed by normalized UAI while retaining `schools.id` as the operational tenant identifier. Strengthen the existing official-data synchronizer, then provide searchable/UAI onboarding with explicit confirmation and an atomic database-enforced claim.

## Boundaries & Constraints

**Always:** Import every public/private Paris school in the maternal, elementary, primary, or combined perimeter; preserve the France-wide importer; use official level flags/nature/sector rather than names; keep official and SecuriClick data separate; normalize UAI to uppercase `^[0-9]{7}[A-Z]$`; keep existing foreign keys and data; auto-link legacy records only on a provably exact UAI; paginate/debounce/cache mobile search; return public fields only; expose typed business states; keep FR/EN parity; test database concurrency and RLS.

**Ask First:** Any destructive legacy cleanup, uncertain historical link, production database migration, or change of official dataset. Git commit/push is authorized only after all achievable checks pass.

**Never:** Hardcode Abravanel or any establishment; fuzzy-link or merge distinct UAI; trust frontend validation; expose administrator/member/child data; edit official fields from a school account; load the full directory on-device; use `SELECT *`, `any`, ignored TypeScript errors, or a frontend-only duplicate check.

## I/O & Edge-Case Matrix

| Scenario        | Input / State                           | Expected Output / Behavior                                                                                                | Error Handling                                      |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| UAI lookup      | `0923504j`                              | Normalized lookup returns official Abravanel record and combined levels                                                   | No hardcoded fixture in runtime code                |
| Invalid/unknown | malformed or absent UAI                 | Immediate ergonomic format error or neutral not-found state                                                               | Suggest name search; no technical text              |
| Search          | name, city, postal code, or UAI         | Ranked, paginated public summaries                                                                                        | Debounced; offline/error state with retry           |
| Claim           | active, unclaimed establishment         | Confirmed account links to one `schools` tenant                                                                           | CTA locked while pending                            |
| Duplicate race  | two users claim same UAI                | Exactly one tenant wins                                                                                                   | Loser receives `already_claimed`, no admin identity |
| Inactive        | officially closed establishment         | Visible as unavailable, cannot be claimed                                                                                 | Support guidance                                    |
| Sync            | complete Paris/France run               | Upsert by UAI, accurate counts/duration, missing records detected, unseen records closed only after successful completion | Retry/checkpoint; isolate invalid rows              |
| Legacy          | existing school without trustworthy UAI | Existing flows continue with `needs_review`                                                                               | Never auto-link by fuzzy name/address               |

</frozen-after-approval>

## Code Map

- `database/migrations/044_education_establishments_uai.sql` -- new directory, sync audit, safe legacy backfill, search/lookup/claim RPCs, RLS, indexes, hardened signup trigger.
- `database/migrations/045_improve_education_establishment_address_search.sql` -- complete-address search document, cross-field token matching, address-aware ranking, and trigram index.
- `scripts/import-schools.ts` -- resumable official France/Paris CLI importer and completeness reporting.
- `supabase/functions/sync-schools/index.ts` -- authenticated scheduled synchronizer using the same mapping contract.
- `src/features/school/directory/**` -- typed normalization, API, React Query hooks, cards, search/UAI selector, confirmation and state handling.
- `src/features/auth/{schemas,types,services,screens}/**` -- require a confirmed directory record and submit its UAI during school signup.
- `src/features/parent/components/ui/SchoolPickerSheet.tsx` and child edit/add flows -- reuse the official selector without changing existing `school_id` semantics.
- `src/features/school/components/ui/EditSchoolSheet.tsx` -- official identity read-only; SecuriClick fields remain editable.
- `src/i18n/locales/{fr,en}/**` -- all new labels and business errors.
- `supabase/tests/**`, `src/**/*.test.ts(x)`, `package.json`, Jest/ESLint config -- unit, UI, DB/RLS/race harness and reliable verification commands.

## Tasks & Acceptance

**Execution:**

- [ ] Add the non-destructive directory migration with exact-UAI backfill, `needs_review`, safe public RPCs, atomic claim, hardened role/profile policies, and secured `search_path`.
- [ ] Replace both divergent import mappings with shared official field semantics; add Paris completeness, France scope, run metrics, checkpoints, retries, closure reconciliation, and truthful error counts.
- [ ] Build typed directory services/hooks with stable query keys, UAI normalization, pagination, debounce, cache, retry, and friendly discriminated errors.
- [ ] Build the two-option premium selector and mandatory confirmation, then integrate school signup and parent child selection while preserving existing routes and tenant IDs.
- [ ] Make official school identity immutable in profile editing and localize FR/EN copy.
- [ ] Add unit/component tests plus SQL tests for format, search, migration, permissions, idempotence, closures, exact backfill, and concurrent claims.
- [ ] Repair verification tooling or scoped blockers required to run typecheck, lint, and tests; document unrelated pre-existing failures if any cannot safely be changed.
- [ ] Validate the official Abravanel UAI through seeded/official-source tests, run the Paris completeness audit, review diffs, commit, and push only after verification.

**Acceptance Criteria:**

- Given a successful full Paris sync, when official open-school results are reconciled, then every valid in-scope UAI is present once and the run records fetched/inserted/updated/skipped/error/missing counts and duration.
- Given existing SecuriClick data, when migration runs, then all current foreign keys remain valid and only exact trustworthy UAI links are automatic.
- Given any mobile directory response, when inspected by an anonymous or authenticated client, then it contains no internal school, administrator, membership, child, or operational metrics.
- Given an official selection, when the user modifies it, then the selector reopens and no persisted association changes until reconfirmed.

## Design Notes

`education_establishments` owns administrative identity and activity. `schools` remains the SecuriClick tenant and receives a nullable unique `education_establishment_id`; existing `school_id` foreign keys do not move. The official dataset remains `fr-en-annuaire-education`; current verified fields include UAI, official name, sector, nature, maternal/elementary flags, address, geography, contact, source update date, and activity.

## Verification

**Commands:**

- `bun run typecheck` -- zero TypeScript errors.
- `bun run lint` -- zero lint errors.
- `bun run test` -- unit/component suites pass.
- `supabase test db` or repository SQL harness -- migrations, RLS, and concurrent-claim tests pass.
- `bunx expo-doctor` -- no new project-health regression.
- Paris sync dry-run/audit command -- complete, duplicate-free UAI report; `0923504J` resolves from the directory.

**Manual checks:**

- Verify search/UAI/confirmation/modify/duplicate/inactive/offline/retry/persistence on iOS and Android, plus public/private/maternal/elementary/combined records and legacy unlinked schools.
