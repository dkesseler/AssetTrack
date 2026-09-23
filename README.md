# AssetTrack (Contoso Industries)

> [!IMPORTANT]
> **Security Warning**
>
> This repository contains intentionally insecure code and an intentionally vulnerable application for educational and security-testing purposes only. Do not deploy it to production, expose it to the public internet, or run it on systems containing sensitive data. Use it only in an isolated, authorized environment, such as a sandbox or disposable virtual machine. You are responsible for preventing unauthorized access, misuse, or unintended impact on your systems and networks.

AssetTrack is Contoso Industries' internal application for tracking hardware assets (laptops, monitors, phones, badges, docking stations) and the employees they're assigned to. It is intentionally built as a **polyglot microservices** application so that course learners can practice agentic, Copilot-driven development across a realistic multi-language stack — including a couple of older Java services that still need modernization.

## Architecture at a glance

```mermaid
flowchart LR
    browser([Browser]) --> web

    subgraph frontend
      web[web<br/>Astro SSR + React islands]
    end

    subgraph modern[Modern services]
      assets[assets-svc<br/>.NET 10]
      workforce[workforce-svc<br/>Java 21 / Spring Boot 3]
      reporting[reporting-svc<br/>Python FastAPI]
      notifications[notifications-svc<br/>Python FastAPI]
    end

    subgraph behind[Services a generation behind - due for a currency upgrade]
      audit[audit-svc<br/>Java 17 / Spring Boot 3.5]
      auth[auth-svc<br/>Java 17 / Spring Boot 3.5]
    end

    web --> assets
    web --> workforce
    web --> reporting
    web --> auth
    workforce -.audit hook<br/>not yet wired.-> audit
    workforce --> notifications
    assets -.JWKs.-> auth
    workforce -.JWKs.-> auth
```

All services talk over **REST/JSON**. Each service owns its own SQLite database.

| Service              | Stack                                  | Port  | Owns                                |
|----------------------|----------------------------------------|-------|-------------------------------------|
| `web`                | Astro (SSR) + React islands + Bootstrap 5 | 4321  | UI, BFF composition                 |
| `assets-svc`         | .NET 10 (ASP.NET Core minimal APIs)    | 5001  | Asset CRUD + search                 |
| `workforce-svc`      | Java 21 / Spring Boot 3                | 5002  | Employees + Assignments             |
| `reporting-svc`      | Python 3.12 / FastAPI                  | 5003  | Reports, CSV bulk import            |
| `notifications-svc`  | Python 3.12 / FastAPI                  | 5004  | Webhook receiver, email/Slack stub  |
| `audit-svc`          | Java 17 / Spring Boot 3.5 *(a generation behind)* | 5005  | Audit event log                     |
| `auth-svc`           | Java 17 / Spring Boot 3.5 *(a generation behind)* | 5006  | JWT issuer, user lookup             |

## Quick start (Codespaces or local devcontainer)

1. Open the repository in GitHub Codespaces, or in VS Code with the Dev Containers extension.
2. Wait for the devcontainer to finish provisioning. It installs:
   - Node 22, .NET 10, Python 3.12, Maven, and **Java 21** (the JDK for all three JVM services; the two currency-lagging services target Java 17 bytecode and build fine on JDK 21).
   - `concurrently` and editable Python installs for the FastAPI services (via `postCreateCommand`).
3. From the workspace root:

   ```bash
   npm run dev
   ```

   This starts all seven services as plain processes (no Docker required). A startup banner prints the URL. Run `npm run dev:verbose` if you need full log output instead of WARN-only.

4. Open http://localhost:4321 — that's the UI. Backend services listen on 5001–5006 if you want to hit them directly with `curl`.

## Quick start (local without a devcontainer)

You need Node 22, .NET 10, Python 3.12, Maven, **and Java 21** on your machine. Then:

```bash
npm install
npm run install:all
npm run dev
```

## Running with Docker (optional)

A `docker-compose.yml` is still provided as an alternative to the dockerless workflow:

```bash
docker compose up --build
```

Open http://localhost:4321.

## Running a single service for development

Each service folder has its own `README.md` with native (non-Docker) run instructions and per-service scripts. See:

- [`services/web/README.md`](services/web/README.md)
- [`services/assets-svc/README.md`](services/assets-svc/README.md)
- [`services/workforce-svc/README.md`](services/workforce-svc/README.md)
- [`services/reporting-svc/README.md`](services/reporting-svc/README.md)
- [`services/notifications-svc/README.md`](services/notifications-svc/README.md)
- [`services/audit-svc/README.md`](services/audit-svc/README.md)
- [`services/auth-svc/README.md`](services/auth-svc/README.md)

## Auth

`auth-svc` issues RS256 JWTs from `POST /token`. Other services validate tokens via the JWKs document at `http://auth-svc:8080/.well-known/jwks`.

For course exercises that aren't about auth, the frontend runs with `DEV_TOKEN_MODE=true`, which uses a pre-issued long-lived token so learners aren't blocked by login flows. To exercise the real flow, set it to `false`.

## What's intentionally broken or missing

This is a teaching codebase. Several services have deliberate gaps that drive the course exercises (see [`exercises.md`](exercises.md)). For example:

- The two legacy Java services use raw JDBC string concatenation and have SQL injection.
- `reporting-svc` has old-style Python helpers and an import endpoint that crashes on bad rows.
- `assets-svc` accepts unvalidated input on create.
- The dashboard renders some status badges with the wrong colors.
- `workforce-svc` does not yet POST to `audit-svc` on assignment changes.

See [`exercises.md`](exercises.md) for the full exercise list.

## Course exercises

See [`exercises.md`](exercises.md). Each exercise is **atomic** — completing one is not a prerequisite for another. Exercises cover all five stacks (Astro, .NET, modern Java, Python, legacy Java) so learners can pick what's most useful to them.

## License

This project is licensed under the terms of the MIT license. See [LICENSE](LICENSE) for the full text.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up the polyglot devcontainer, run the tests, and open a pull request.

## Code of Conduct

This project has adopted a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## Support

Looking for help? See [SUPPORT.md](SUPPORT.md) for how to file issues and get assistance.

## Security

To report a security vulnerability, please follow the process described in [SECURITY.md](SECURITY.md). Please do not report security issues through public GitHub issues.
