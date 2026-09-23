# auth-svc (Java 17 / Spring Boot 3.5 — a generation behind)

> [!IMPORTANT]
> This service is **a generation behind** the team's current cadence — Spring Boot 3.5, Java 17, raw JDBC, plain-text passwords. It is CVE-clean but due for a currency upgrade, and gives course learners a realistic modernization/security target.

Issues RS256 JWTs and exposes a JWKs document so other services can validate tokens.

## Endpoints

| Method | Path                  | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/health`             | Liveness check                           |
| POST   | `/token`              | Exchange username/password for a JWT     |
| GET    | `/.well-known/jwks`   | Public JWKs document for token validation |
| GET    | `/users/{id}`         | Get a user by id                         |

## Seeded users

| username   | password   | role     |
|------------|------------|----------|
| `admin`    | `password` | admin    |
| `helpdesk` | `password` | helpdesk |
| `viewer`   | `password` | viewer   |

## Run locally

```bash
mvn spring-boot:run
```

## Known smells (course material)

- **SQL injection** in `UserRepository.findByUsername` (string concatenation). Course exercise target.
- **Plain-text passwords** in the seeded database.
- **No tests** in this module.
- **Spring Boot 3.5 / Java 17** — a generation behind the team's Spring Boot 4 / Java 21 target; the currency-upgrade exercise (including the jjwt/serializer migration) brings it current.
