// Typed clients for each backend service. The Astro server reads service URLs
// from env vars set by docker-compose, so we centralize them here.
//
// We read from `process.env` (not `import.meta.env`) so the URLs are resolved
// at runtime inside the container rather than baked in at build time.

const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;

export const SERVICE_URLS = {
  assets: env.ASSETS_SVC_URL ?? "http://localhost:5001",
  workforce: env.WORKFORCE_SVC_URL ?? "http://localhost:5002",
  reporting: env.REPORTING_SVC_URL ?? "http://localhost:5003",
  notifications: env.NOTIFICATIONS_SVC_URL ?? "http://localhost:5004",
  audit: env.AUDIT_SVC_URL ?? "http://localhost:5005",
  auth: env.AUTH_SVC_URL ?? "http://localhost:5006",
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, `${res.status} ${res.statusText} from ${url}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
