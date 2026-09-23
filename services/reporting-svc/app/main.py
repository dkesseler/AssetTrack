"""reporting-svc — warranty/utilization reports and CSV bulk import."""

import os
from fastapi import FastAPI
from .routers import reports, imports_

app = FastAPI(title="reporting-svc", version="0.1.0")
app.include_router(reports.router)
app.include_router(imports_.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "reporting-svc"}


# Make backend service URLs available to routers.
ASSETS_SVC_URL = os.getenv("ASSETS_SVC_URL", "http://assets-svc:8080")
WORKFORCE_SVC_URL = os.getenv("WORKFORCE_SVC_URL", "http://workforce-svc:8080")
