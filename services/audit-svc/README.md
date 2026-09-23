# audit-svc (Java 17 / Spring Boot 3.5 — a generation behind)

> [!IMPORTANT]
> This service is **a generation behind** the team's current cadence — Spring Boot 3.5, Java 17, raw JDBC, no tests. It is CVE-clean but due for a currency upgrade, so it exists as a realistic modernization target for the course.

Append-only audit log. Other services POST events; humans GET them.

## Endpoints

| Method | Path                | Description                                            |
|--------|---------------------|--------------------------------------------------------|
| GET    | `/health`           | Liveness check                                         |
| POST   | `/events`           | Record an audit event                                  |
| GET    | `/events`           | List most recent events (`limit`, or `query` to search)|

### Event body shape

```json
{
  "actor": "helpdesk@contoso.example",
  "action": "assignment.create",
  "entityType": "assignment",
  "entityId": "42",
  "details": "Assigned CON-LPT-001 to employee 7"
}
```

## Run locally

```bash
mvn spring-boot:run
```

## Known smells (course material)

- **SQL injection** in `AuditRepository.search` (string concatenation across three `LIKE` clauses). Course exercise target.
- **No tests** in this module.
- **Spring Boot 3.5 / Java 17** — a generation behind the team's Spring Boot 4 / Java 21 target; the currency-upgrade exercise brings it current.
- Nothing currently POSTs to this service from `workforce-svc` — wiring that up is also an exercise.
