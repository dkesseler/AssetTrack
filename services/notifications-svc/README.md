# notifications-svc (Python 3.12 / FastAPI)

A small webhook receiver. Other services (currently just `workforce-svc`) POST events here; this service "delivers" them by writing them to a local SQLite event log and logging stub email + Slack messages to stdout.

## Endpoints

| Method | Path                       | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/health`                  | Liveness check                           |
| POST   | `/webhooks/assignment`     | Receives an assignment event             |
| GET    | `/events?limit=`           | Recent events from the local store       |

## Run locally

```bash
pip install fastapi 'uvicorn[standard]' pydantic
uvicorn app.main:app --reload --port 8080
```

## Notes

- Delivery is **synchronous best-effort** — there's no queue and no retry. Adding resilience (retries, dead-letter, or a real queue) is a candidate future exercise.
