## Description

<!-- Provide a brief summary of your changes and the motivation behind them. -->

## Related Issue

<!-- All changes should start with an issue. Link it below (e.g. "Closes #123"). -->


## Type of Change

<!-- Check the relevant option(s) -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📚 Documentation update
- [ ] 🧪 Test update
- [ ] 🔧 Refactor (no functional changes)

## Affected Services

<!-- Check the services/areas this PR touches -->

- [ ] `web` (Astro SSR + React)
- [ ] `assets-svc` (.NET 10)
- [ ] `workforce-svc` (Java 21 / Spring Boot 3)
- [ ] `reporting-svc` (Python FastAPI)
- [ ] `notifications-svc` (Python FastAPI)
- [ ] `audit-svc` (legacy Java 11 / Spring Boot 2.7)
- [ ] `auth-svc` (legacy Java 11 / Spring Boot 2.7)
- [ ] devcontainer / tooling / docs

## Changes Made

<!-- List the key changes in this PR -->

-

## Testing

<!-- Check the suites you ran for the services you changed. Not every box applies to every PR. -->

- [ ] End-to-end (web): `npm run test:e2e` (Playwright) passes
- [ ] .NET: `dotnet test` in `services/assets-svc` passes
- [ ] Python: `pytest` in `services/reporting-svc` and/or `services/notifications-svc` passes
- [ ] Modern Java: `mvn test` in `services/workforce-svc` passes
- [ ] Currency-lagging Java: `mvn test` in `services/audit-svc` and/or `services/auth-svc` passes
- [ ] Manually verified the app runs (`npm run dev` or `docker compose up --build`) and the affected flow works at http://localhost:4321

## Checklist

<!-- Ensure all items are complete before requesting review -->

- [ ] My change targets `main` (I have not hand-edited generated learner branches or promoted refs — see CONTRIBUTING.md)
- [ ] My code follows the project's coding standards for the affected language/stack
- [ ] My changes are focused on a single concern
- [ ] I have added or updated tests where it makes sense
- [ ] I have updated documentation (README, per-service READMEs, `exercises.md`) if needed
- [ ] I have written clear commit messages explaining what and why

## Additional Notes

<!-- Any additional context, concerns, or notes for reviewers -->
