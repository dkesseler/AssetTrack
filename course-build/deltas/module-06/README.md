# Module 06 delta — LANDED

**Produces:** `start-of-module-07` (= cumulative end state of Module 06)

**Adds** (seed — Copilot-authored, performing ACC module 06; secure-to-secure currency upgrade):
- Modernization of `services/audit-svc` and `services/auth-svc`: Spring Boot `3.5.16` → `4.1.0`, Java `17` → `21`, Dockerfiles `temurin-17` → `temurin-21`, and `jackson-bom`/`log4j2` currency pins (Jackson 3 `3.1.6`, Log4j2 `2.25.5`) since Boot 4.1.0 natively resolves the vulnerable `3.1.4` / `2.25.4`. Baseline test suites added.
- `auth-svc` only: `jjwt` `0.11.5` → `0.12.7` with the fluent builder API in `JwtIssuer`, and `jjwt-jackson` → `jjwt-gson` so JWT (de)serialization stays off Jackson 2 (which Boot 4 no longer manages).
- `.github/lsp.json` (Java `jdtls`), `.github/agents/java-migrator.agent.md`, `docs/modernization/audit-svc-plan.md`, `docs/modernization/migration-playbook.md`, extended `.github/hooks/scripts/test-router.sh`.

**Note:** the previous `javax.annotation.PostConstruct` → `jakarta` rename and the `package.json` `with-java11` shim removal are no longer part of this delta — both are pre-done on the re-baselined base (the secure Boot 3.5.16 / Java 17 "before" already runs on Jakarta and a single JDK 21).

**Verified:** `build-branches.mjs --check` reproduces `expectedTreeSha` `54a47a032fe12e6f9496040d93c6ed123c28f8b3`. audit-svc: 3/3, auth-svc: 4/4 `mvn verify` on Boot 4.1.0 / Java 21; resolved trees OSV-clean. See `manifest.json` (module 6).
