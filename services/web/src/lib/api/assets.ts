import { apiFetch, SERVICE_URLS } from "./client";

export interface Asset {
  id: number;
  assetTag: string;
  assetType: string;
  manufacturer: string;
  model: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  status: string;
  notes: string | null;
}

export function listAssets(): Promise<Asset[]> {
  return apiFetch<Asset[]>(`${SERVICE_URLS.assets}/assets`);
}

export function searchAssets(params: { type?: string; status?: string; q?: string }): Promise<Asset[]> {
  const qs = new URLSearchParams();
  if (params.type)   qs.set("type", params.type);
  if (params.status) qs.set("status", params.status);
  if (params.q)      qs.set("q", params.q);
  return apiFetch<Asset[]>(`${SERVICE_URLS.assets}/assets/search?${qs.toString()}`);
}

export function getAsset(id: number): Promise<Asset> {
  return apiFetch<Asset>(`${SERVICE_URLS.assets}/assets/${id}`);
}

export function getAssetByTag(tag: string): Promise<Asset> {
  return apiFetch<Asset>(`${SERVICE_URLS.assets}/assets/by-tag/${encodeURIComponent(tag)}`);
}

export function createAsset(body: Partial<Asset>): Promise<{ id: number }> {
  return apiFetch<{ id: number }>(`${SERVICE_URLS.assets}/assets`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function statsByStatus(): Promise<Record<string, number>> {
  return apiFetch<Record<string, number>>(`${SERVICE_URLS.assets}/assets/stats/by-status`);
}
