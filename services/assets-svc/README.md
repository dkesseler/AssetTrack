# assets-svc (.NET 10)

Owns the **Asset** domain: hardware items tracked by Contoso Industries.

## Stack

- .NET 10, ASP.NET Core minimal APIs
- Dapper over SQLite
- Swagger UI at `/swagger`

## Endpoints

| Method | Path                       | Description                                |
|--------|----------------------------|--------------------------------------------|
| GET    | `/health`                  | Liveness check                             |
| GET    | `/assets`                  | List all assets                            |
| GET    | `/assets/search?type=&status=&q=` | Filter by type, status, free-text   |
| GET    | `/assets/{id}`             | Get one by id                              |
| GET    | `/assets/by-tag/{tag}`     | Get one by asset tag                       |
| POST   | `/assets`                  | Create asset *(no validation — exercise)*  |
| PUT    | `/assets/{id}`             | Update asset                               |
| DELETE | `/assets/{id}`             | Delete asset                               |
| GET    | `/assets/stats/by-status`  | Counts grouped by status (for dashboard)   |

## Run locally

```bash
dotnet run
```

Service listens on `http://localhost:8080`. Override with `ASPNETCORE_URLS`.

## Run tests

```bash
dotnet test
```

The test project (`Tests/`) is intentionally **mostly empty** — it has a single smoke test. Filling out the `AssetService` test coverage is one of the course exercises.

## Known gaps (course material)

- `POST /assets` accepts anything (empty strings, missing required fields, bad dates). Target of the input-validation exercise.
- JWT validation is **not** wired here. Adding it is a course exercise.
- The test suite is mostly empty by design.
