"""Warranty + utilization reports. Pulls live data from assets-svc and workforce-svc."""

import os
from datetime import date, timedelta
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException

from ..legacy import format_helpers

router = APIRouter(prefix="/reports", tags=["reports"])

ASSETS_SVC_URL = os.getenv("ASSETS_SVC_URL", "http://assets-svc:8080")
WORKFORCE_SVC_URL = os.getenv("WORKFORCE_SVC_URL", "http://workforce-svc:8080")


async def _get_assets() -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{ASSETS_SVC_URL}/assets")
        r.raise_for_status()
        return r.json()


@router.get("/warranty-expiring")
async def warranty_expiring(within_days: int = 180):
    """Assets with warranty expiring within `within_days` days, or already expired."""
    try:
        assets = await _get_assets()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"assets-svc unavailable: {e}") from e

    cutoff = date.today() + timedelta(days=within_days)
    rows = []
    for a in assets:
        exp = a.get("warrantyExpiry")
        if not exp:
            continue
        try:
            exp_date = date.fromisoformat(exp)
        except ValueError:
            continue
        if exp_date <= cutoff:
            rows.append({
                "assetTag": a["assetTag"],
                "model": a["model"],
                "warrantyExpiry": exp,
                # Deliberately using the legacy %-format helper. Modernizing this
                # is part of the "Modernize the Python Scripts" exercise.
                "label": format_helpers.format_warranty_label(a["assetTag"], exp_date),
                "status": a["status"],
            })
    rows.sort(key=lambda r: r["warrantyExpiry"])
    return {"count": len(rows), "within_days": within_days, "items": rows}


@router.get("/utilization")
async def utilization():
    """Counts grouped by asset status. Used by the dashboard."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{ASSETS_SVC_URL}/assets/stats/by-status")
            r.raise_for_status()
            by_status = r.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"assets-svc unavailable: {e}") from e

    total = sum(by_status.values()) if by_status else 0
    in_use = by_status.get("assigned", 0)
    return {
        "total": total,
        "in_use": in_use,
        "utilization_pct": round((in_use / total) * 100, 1) if total else 0.0,
        "by_status": by_status,
    }
