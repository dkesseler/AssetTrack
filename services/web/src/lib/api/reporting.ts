import { apiFetch, SERVICE_URLS } from "./client";

export interface WarrantyRow {
  assetTag: string;
  model: string;
  warrantyExpiry: string;
  label: string;
  status: string;
}

export function warrantyExpiring(withinDays = 180): Promise<{ count: number; items: WarrantyRow[] }> {
  return apiFetch(`${SERVICE_URLS.reporting}/reports/warranty-expiring?within_days=${withinDays}`);
}

export function utilization(): Promise<{ total: number; in_use: number; utilization_pct: number; by_status: Record<string, number> }> {
  return apiFetch(`${SERVICE_URLS.reporting}/reports/utilization`);
}
