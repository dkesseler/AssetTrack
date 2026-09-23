# reporting-svc (Python 3.12 / FastAPI)

Reporting, analytics, and CSV bulk-import for AssetTrack. Pulls data live from `assets-svc` (and `workforce-svc` where needed) — it does **not** own a primary database.

## Endpoints

| Method | Path                                     | Description                                |
|--------|------------------------------------------|--------------------------------------------|
| GET    | `/health`                                | Liveness check                             |
| GET    | `/reports/warranty-expiring?within_days` | Assets with warranties expiring (or expired) |
| GET    | `/reports/utilization`                   | Totals + utilization % across statuses     |
| POST   | `/imports/assets` (multipart)            | Bulk-import assets from a CSV file         |

## Run locally

```bash
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8080
```

## Sample CSV

A `sample_import.csv` is included in the repo root of this service. Try it:

```bash
curl -F "file=@sample_import.csv" http://localhost:5003/imports/assets
```

## Known gaps (course material)

- `POST /imports/assets` has **no row-level validation**. A single malformed row crashes the whole request. Adding skip-and-summarize is a course exercise.
- `app/legacy/format_helpers.py` is written in deliberately dated Python (% formatting, no f-strings, no `pathlib`, no type hints). Modernizing it is a course exercise.
- The test suite under `tests/` is intentionally empty. Adding pytest coverage is a course exercise.
