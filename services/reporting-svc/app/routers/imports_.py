"""CSV bulk import endpoint. Replaces the old `scripts/import_assets.py` script.

Note: there is intentionally no row-level validation here — malformed CSV rows
will cause the whole request to crash. Adding error handling and a success/failure
summary is one of the course exercises.
"""

import csv
import io
import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File

router = APIRouter(prefix="/imports", tags=["imports"])

ASSETS_SVC_URL = os.getenv("ASSETS_SVC_URL", "http://assets-svc:8080")

REQUIRED_COLUMNS = ["asset_tag", "asset_type", "manufacturer", "model", "status"]


@router.post("/assets")
async def import_assets(file: UploadFile = File(...)) -> dict[str, Any]:
    raw = (await file.read()).decode("utf-8")
    reader = csv.DictReader(io.StringIO(raw))

    if reader.fieldnames is None or not all(c in reader.fieldnames for c in REQUIRED_COLUMNS):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {', '.join(REQUIRED_COLUMNS)}",
        )

    created = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for row in reader:
            # NO VALIDATION ON PURPOSE — this is the target of the
            # "Add Error Handling to Python Import Script" exercise.
            # A bad row will blow up the whole request.
            payload = {
                "assetTag": row["asset_tag"],
                "assetType": row["asset_type"],
                "manufacturer": row["manufacturer"],
                "model": row["model"],
                "serialNumber": row.get("serial_number") or None,
                "purchaseDate": row.get("purchase_date") or None,
                "warrantyExpiry": row.get("warranty_expiry") or None,
                "status": row["status"],
                "notes": row.get("notes") or None,
            }
            r = await client.post(f"{ASSETS_SVC_URL}/assets", json=payload)
            r.raise_for_status()
            created.append(payload["assetTag"])

    return {"imported": len(created), "asset_tags": created}
