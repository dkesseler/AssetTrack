# Contributing to AssetTrack

[fork]: https://github.com/github-samples/contoso-inventory/fork
[pr]: https://github.com/github-samples/contoso-inventory/compare
[code-of-conduct]: CODE_OF_CONDUCT.md

Thank you for your interest in contributing to the **AssetTrack (Contoso Industries) sample**! This is an intentionally polyglot microservices application used to teach agentic, Copilot-driven development across a realistic multi-language stack. Your help improving it benefits every learner who works through it.

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [project's open source license](LICENSE).

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

## Getting Started

### Prerequisites

AssetTrack is a polyglot stack, so the fastest and most reliable way to work on it is inside the provided **devcontainer** — either in [GitHub Codespaces](https://github.com/features/codespaces) or locally with the [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers). The devcontainer provisions everything you need:

- **Node.js 22** — the `web` frontend and the root dev orchestrator
- **.NET 10** — `assets-svc`
- **Python 3.12** — `reporting-svc` and `notifications-svc`
- **Java 21 and Java 11 side-by-side** — Java 21 for `workforce-svc`; Java 11 for the two legacy services (`audit-svc`, `auth-svc`)
- **Maven** — build/test for all three Java services

If you prefer to work without the devcontainer, you'll need all of the above installed natively (Node 22, .NET 10, Python 3.12, Maven, **and both Java 21 and Java 11**). Using the devcontainer is strongly recommended so your toolchain matches CI and the course.

### Setting Up Your Development Environment

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/contoso-inventory.git
   cd contoso-inventory
   ```

2. Open the folder in Codespaces or in VS Code and "Reopen in Container". Wait for the devcontainer to finish provisioning (its `postCreateCommand` installs the root npm deps and the editable Python installs for the FastAPI services).

   If you're running natively instead:
   ```bash
   npm install
   npm run install:all
   ```

3. Start the whole stack from the workspace root:
   ```bash
   npm run dev
   ```

   This runs all seven services as plain processes (no Docker required). Use `npm run dev:verbose` if you want full logs instead of WARN-only output.

4. Open your browser to [http://localhost:4321](http://localhost:4321). Backend services listen on ports 5001–5006 if you want to hit them directly with `curl`.

Prefer containers? A Docker Compose flow is also provided:
```bash
docker compose up --build
```

## Project Structure

- `services/web/` — Astro SSR frontend with React islands (Bootstrap 5); also composes the backend calls (BFF)
- `services/assets-svc/` — .NET 10 (ASP.NET Core minimal APIs); asset CRUD + search
- `services/workforce-svc/` — Java 21 / Spring Boot 3; employees + assignments
- `services/reporting-svc/` — Python 3.12 / FastAPI; reports + CSV bulk import
- `services/notifications-svc/` — Python 3.12 / FastAPI; webhook receiver + email/Slack stub
- `services/audit-svc/` — Java 17 / Spring Boot 3.5 *(a generation behind)*; audit event log
- `services/auth-svc/` — Java 17 / Spring Boot 3.5 *(a generation behind)*; JWT issuer + user lookup
- `exercises.md` — the course exercises; several intentional gaps in the code exist to drive these
- `.devcontainer/` — the devcontainer definition (Node, .NET, Python, Java 21, Maven)

Each service also has its own `README.md` with native run instructions.

## Making Changes

Follow the conventions of whichever service you're touching. A few stack-specific notes:

- **web (Astro/React):** build UI as `.astro` pages/components with React islands where interactivity is needed; use Bootstrap 5 utility classes. Add `data-testid` attributes to interactive elements so the Playwright tests can target them.
- **assets-svc (.NET 10):** keep endpoints as minimal APIs; validate input on create paths.
- **workforce-svc (Java 21):** standard Spring Boot 3 conventions.
- **reporting-svc / notifications-svc (Python/FastAPI):** keep handlers small and typed; prefer `pydantic` models for request/response shapes.
- **audit-svc / auth-svc (Java 17 / Spring Boot 3.5, a generation behind):** these trail the team's current cadence (one Spring Boot generation back, Java 17 rather than 21). Some course exercises are *about* modernizing them, so check `exercises.md` before "fixing" something that may be a deliberate teaching gap. They build on the Java 21 JDK, targeting Java 17 bytecode.

### Running the tests

Run the suites for the services you changed:

- **End-to-end (web):** from the repo root, `npm run test:e2e` (Playwright browser tests against the running stack).
- **.NET:** `dotnet test` in `services/assets-svc`.
- **Python:** `pytest` in `services/reporting-svc` and/or `services/notifications-svc`.
- **Modern Java:** `mvn test` in `services/workforce-svc`.
- **Currency-lagging Java:** `mvn test` in `services/audit-svc` and/or `services/auth-svc` (Java 17 bytecode, builds on JDK 21).

All tests you touch should pass before you open a pull request.

## Course branch system

> [!IMPORTANT]
> This repository is the source for a hands-on course, and a large part of its layout is **machine-generated and human-gated**. Understanding this before you contribute will save you (and reviewers) a lot of trouble.

- The `start-of-module-*` branches, the `acc-<version>/*` tags, and the `course-build/` directory are **generated artifacts**, not hand-authored source. They are produced by tooling and gated by a human reviewer.
- **Contributors change `main` only.** Do not hand-edit generated learner branches, and do not promote or push generated refs (`start-of-module-*`, `regen/*`, `acc-*`) directly. Those are produced and published by the maintained build/promotion process, not by contributor PRs.
- The rules and procedures for how these refs are generated and promoted live in `course-build/REFS.md` and `course-build/OPERATIONS.md`. If your change affects course content or the generated branches, describe the intended outcome on `main` and let the maintainers run the generation/promotion step.

In short: make your change on `main` via a normal pull request, and never treat the generated branches, tags, or `course-build/` outputs as something to edit by hand.

## Submitting a Pull Request

### Issues

All change requests should start with an issue. You're welcome to file the issue alongside the PR, but an issue must always be created so the work can be discussed and tracked.

### Workflow

1. Create a new branch from `main` for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the conventions of the affected service(s).

3. Run the relevant test suites (see [Running the tests](#running-the-tests)) and make sure the app still starts (`npm run dev`).

4. Commit your changes with a clear, descriptive message:
   ```bash
   git commit -m "Add feature: brief description of changes"
   ```

5. Push to your fork and [submit a pull request][pr].

6. Wait for your pull request to be reviewed and merged.

### Pull Request Guidelines

- Use the pull request template and complete every relevant section, including the affected services and the test suites you ran.
- Keep your changes focused. Submit unrelated changes as separate pull requests.
- Write clear commit messages that explain *what* and *why*.
- Update documentation (the root `README.md`, the per-service `README.md`, or `exercises.md`) if your change affects how the app is run or taught.
- Target `main` — never the generated course branches (see [Course branch system](#course-branch-system)).
- Be responsive to feedback and ready to make adjustments.

## Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/github-samples/contoso-inventory/issues/new/choose) with:

- A clear, descriptive title
- Which service/stack is affected
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Screenshots or logs if applicable
- Your environment details (OS, and Node/.NET/Java/Python versions as relevant)

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [Writing Good Commit Messages](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)
- [GitHub Help](https://help.github.com)
