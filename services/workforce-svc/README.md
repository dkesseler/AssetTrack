# workforce-svc (Java 21 / Spring Boot 3)

Owns the **Employee** and **Assignment** domains.

## Stack

- Java 21, Spring Boot 3.5
- Spring Data JPA + Hibernate (community SQLite dialect)
- SQLite

## Endpoints

| Method | Path                                      | Description                              |
|--------|-------------------------------------------|------------------------------------------|
| GET    | `/health`                                 | Liveness check                           |
| GET    | `/employees`                              | List employees (filter `department`, `active`) |
| GET    | `/employees/{id}`                         | Get one                                  |
| POST   | `/employees`                              | Create                                   |
| PUT    | `/employees/{id}`                         | Update                                   |
| DELETE | `/employees/{id}`                         | Delete                                   |
| GET    | `/assignments`                            | List (filter `employeeId`, `assetId`)    |
| GET    | `/assignments/{id}`                       | Get one                                  |
| POST   | `/assignments`                            | Assign an asset to an employee           |
| POST   | `/assignments/{id}/return`                | Mark an assignment returned              |

## Run locally

```bash
./mvnw spring-boot:run
```

or with Maven directly:

```bash
mvn spring-boot:run
```

## Run tests

```bash
mvn test
```

## Known gaps (course material)

- Inactive employees **can** still receive new assets (rule not enforced).
- `returnedDate` is not validated against `assignedDate` (rule not enforced).
- No outbound POST to `audit-svc` on assignment changes — wiring this up is a course exercise.
- Notifications webhook to `notifications-svc` swallows errors silently — "add resilience" is a future exercise.
