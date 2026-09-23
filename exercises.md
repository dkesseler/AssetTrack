# AssetTrack Course Exercises

A set of 15 self-contained exercises against the polyglot AssetTrack system. Each exercise can be done independently — completing one does not require another. Each one is a realistic scenario where Copilot is a force multiplier: filling test/doc gaps, fixing seeded bugs, modernizing legacy code, or adding new features.

Services involved in each exercise are tagged in `[brackets]`.

> [!TIP]
> Before starting, run `docker compose up --build` from the repo root and confirm every service is reachable. The Astro frontend at <http://localhost:4321> is the easiest way to verify the system is alive.

---

## Foundations

### 1. Understand the Codebase  `[all services]`

**Goal:** Build a mental model of the system before changing anything.

The app is split across seven services in three languages (.NET, Java, Python) plus an Astro frontend. Use Copilot to:

- Summarize what each service in `services/*` does and which database it owns.
- Trace a single user action ("create an assignment") from the Astro page through `workforce-svc` to `notifications-svc`.
- List every place data is read or written for a given concept (e.g. "assets").
- Produce a one-page architecture diagram from the source.

**Deliverable:** A short written summary (in your own notes) of the architecture, data flow, and where each domain concept lives.

---

## Tests & Documentation

### 2. Add Unit Tests to the Asset Service  `[assets-svc, .NET]`

**Goal:** Bring `services/assets-svc` to meaningful test coverage.

The test project exists (`services/assets-svc/Tests/`) but only has a smoke test. Use Copilot to author xUnit tests covering:

- Create / read / update / delete happy paths.
- Search by status, by tag, and the stats-by-status endpoint.
- Edge cases: missing fields, unknown ids, empty result sets.

Run with `dotnet test services/assets-svc/Tests/AssetsService.Tests.csproj`.

### 11. Write Pytest Tests for the Reporting Service  `[reporting-svc, Python]`

**Goal:** Create a real test suite for `services/reporting-svc`.

The `tests/` directory is intentionally empty. Use Copilot to scaffold pytest and cover:

- Warranty-expiring report: assets within the configurable window are returned, others are not.
- Utilization report: counts match the seeded data.
- CSV import: a well-formed file produces the expected response shape.

Bonus: write a fixture that spins up an isolated SQLite DB so tests don't depend on the running service.

---

## Security

### 3. Fix the SQL Injection Vulnerabilities  `[auth-svc + audit-svc, Java]`

**Goal:** Eliminate string-concatenation SQL across the two Java services.

Two known vulnerable methods:

- `services/auth-svc/.../UserRepository.java` — `findByUsername` builds SQL with `+ username +`.
- `services/audit-svc/.../AuditRepository.java` — `search` concatenates the query into three `LIKE` clauses.

Use Copilot to convert each to a `PreparedStatement` with bind parameters. Add a regression test for `audit-svc` that proves a payload like `' OR 1=1 --` no longer matches every row.

### 14. Validate JWTs in a Service  `[assets-svc + auth-svc]`

**Goal:** Make `assets-svc` actually enforce the JWTs that `auth-svc` issues.

`auth-svc` already issues RS256 JWTs and exposes its public keys at `GET /.well-known/jwks`. `assets-svc` currently accepts every request unauthenticated. Use Copilot to:

- Add a JWT authentication handler in `services/assets-svc` that fetches and caches the JWKS from `AUTH_JWKS_URL`.
- Reject requests without a valid bearer token on write endpoints (POST/PUT/DELETE).
- Update the Astro server-side fetcher (`services/web/src/lib/api/client.ts`) to forward the token.

---

## Modernization

### 4. Modernize the Python Helpers  `[reporting-svc, Python]`

**Goal:** Bring `services/reporting-svc/app/legacy/format_helpers.py` up to modern Python conventions.

The module uses `%` formatting, `os.path.join`, no type hints, and 2.x-flavored idioms. Use Copilot to:

- Convert to f-strings.
- Use `pathlib.Path` for file paths.
- Add type hints and run `mypy` (or just inspect the result).
- Replace any deprecated stdlib usage.

Verify nothing that imports the module breaks.

### 9. Upgrade Spring Boot 3.5 → 4.1  `[audit-svc, Java]`

**Goal:** Bring `services/audit-svc` current with the latest Spring Boot.

`audit-svc` is secure but a generation behind: it runs on Spring Boot 3.5.16 and Java 17. Use Copilot to bring it current:

- Bump `pom.xml` to Spring Boot 4.1 (Spring Framework 7) and Java 21.
- Work through the Boot 3 → 4 changes, including the move to Jackson 3, and adjust code and configuration as needed.
- Update its `Dockerfile` base image to a Java 21 runtime.
- Run `mvn verify` and fix every failure.

### 12. Upgrade the Second Java Service  `[auth-svc, Java]`

**Goal:** Apply what you learned in exercise 9 to `services/auth-svc`, with a dependency-security twist.

Same Spring Boot 3.5 → 4.1 and Java 17 → 21 jump as #9, but `auth-svc` adds a supply-chain angle. It depends on JJWT (`jjwt-api` / `jjwt-impl` / `jjwt-jackson` 0.11.x), and `jjwt-jackson` drags in a vulnerable transitive Jackson 2 — and the org rule is that no branch may ship a known-vulnerable package. Use Copilot to:

- Bump `pom.xml` to Spring Boot 4.1 and Java 21.
- Upgrade JJWT to 0.12.x and swap `jjwt-jackson` for `jjwt-gson`, so the token layer stops pulling in a vulnerable Jackson 2.
- Watch out for the JJWT API changes across major versions, and don't break the JSON shape of the public `GET /.well-known/jwks` that other services rely on.
- Run `mvn verify` and fix every failure.

---

## Features

### 5. Add Asset Search/Filter  `[assets-svc + web]`

**Goal:** Let users filter the assets list by type and status.

`assets-svc` already has basic search; extend it (or its query parameters) to support combined filters. Update the Astro `services/web/src/pages/assets/index.astro` page to render a filter form and re-render results based on query string.

### 7. Add Input Validation to the Asset Create Form  `[assets-svc + web]`

**Goal:** Stop bad data at the door.

`POST /assets` in `services/assets-svc` accepts anything. Use Copilot to:

- Add a `Validator` or data-annotations-based validation layer on the .NET side, with helpful error responses.
- Show field-level errors on the Astro form at `services/web/src/pages/assets/new.astro`.
- Required: name, assetTag, assetType, status. Date sanity: `purchaseDate <= warrantyExpires`.

### 10. Add a New .NET Endpoint  `[assets-svc + web]`

**Goal:** Add `GET /assets/by-tag/{tag}` (already declared — make sure it's wired and used).

Verify the endpoint in `services/assets-svc/Endpoints/AssetEndpoints.cs` returns the right asset and 404s correctly. Add a typed client method in `services/web/src/lib/api/assets.ts` and use it on the asset detail page lookup.

### 15. Add a New Astro Page  `[web + workforce-svc + assets-svc]`

**Goal:** Build an "Assets by Department" page that composes data from multiple backends.

In `services/web`, add a new page that:

- Calls `workforce-svc` for employees grouped by department.
- Calls `assets-svc` for the assets currently assigned to each employee.
- Renders a table grouped by department with totals.

This is a "real" SSR exercise — all fetching happens on the Astro server.

---

## Bug Fixes

### 8. Fix the Dashboard Display Bug  `[web]`

**Goal:** Wrong status badge colors on the dashboard.

`services/web/src/components/StatusBadge.astro` maps statuses to colors. Two are wrong:

- `retired` is shown as **green** but should be a neutral gray.
- `lost` is shown as **blue** but should be **red**.

Fix the mapping. Bonus: add a Vitest unit test that proves the mapping is correct.

### 6. Add Error Handling to the Import Endpoint  `[reporting-svc, Python]`

**Goal:** Make CSV import resilient.

`POST /imports/assets` in `services/reporting-svc/app/routers/imports_.py` crashes if any single row is malformed. Use Copilot to:

- Wrap per-row processing in try/except.
- Return a summary response: `{ "imported": N, "skipped": M, "errors": [...] }`.
- Add a test that imports `sample_import.csv` with a deliberately broken row and confirms the import still succeeds with one skipped row.

---

## Integration

### 13. Add an Audit Logging Hook  `[workforce-svc + audit-svc]`

**Goal:** Persist an audit event whenever an assignment is created or returned.

`audit-svc` exposes `POST /events` and is fully functional, but `workforce-svc` doesn't call it. In `services/workforce-svc/.../assignment/AssignmentService.java` you'll find a commented-out hook. Use Copilot to:

- Wire an `AuditClient` that posts to `AUDIT_SVC_URL`.
- Send an event on assignment create and on `recordReturn`.
- Make the call best-effort: a failed audit POST must not fail the user-facing operation.

---

## Quick reference

| #   | Title                                          | Primary service(s)              | Skill area      |
| --- | ---------------------------------------------- | ------------------------------- | --------------- |
| 1   | Understand the Codebase                        | all                             | Comprehension   |
| 2   | Unit tests for assets                          | assets-svc                      | Tests           |
| 3   | Fix SQL injection                              | auth-svc, audit-svc             | Security        |
| 4   | Modernize Python helpers                       | reporting-svc                   | Modernization   |
| 5   | Asset search/filter                            | assets-svc, web                 | Feature         |
| 6   | Resilient CSV import                           | reporting-svc                   | Error handling  |
| 7   | Asset create validation                        | assets-svc, web                 | Validation      |
| 8   | Dashboard badge bug                            | web                             | Bug fix         |
| 9   | Upgrade Spring Boot                            | audit-svc                       | Modernization   |
| 10  | New .NET endpoint                              | assets-svc, web                 | Feature         |
| 11  | Pytest for reporting                           | reporting-svc                   | Tests           |
| 12  | Upgrade second Java service                    | auth-svc                        | Modernization   |
| 13  | Audit logging hook                             | workforce-svc, audit-svc        | Integration     |
| 14  | Validate JWTs                                  | assets-svc, auth-svc            | Security        |
| 15  | Cross-service Astro page                       | web, workforce-svc, assets-svc  | Feature         |
