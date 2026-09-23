import { apiFetch, SERVICE_URLS } from "./client";

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  title: string;
  hireDate: string | null;
  active: boolean;
}

export interface Assignment {
  id: number;
  assetId: number;
  employeeId: number;
  assignedDate: string;
  returnedDate: string | null;
  assignedBy: string | null;
  notes: string | null;
}

export function listEmployees(opts: { department?: string; active?: boolean } = {}): Promise<Employee[]> {
  const qs = new URLSearchParams();
  if (opts.department) qs.set("department", opts.department);
  if (opts.active !== undefined) qs.set("active", String(opts.active));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<Employee[]>(`${SERVICE_URLS.workforce}/employees${suffix}`);
}

export function getEmployee(id: number): Promise<Employee> {
  return apiFetch<Employee>(`${SERVICE_URLS.workforce}/employees/${id}`);
}

export function listAssignments(opts: { employeeId?: number; assetId?: number } = {}): Promise<Assignment[]> {
  const qs = new URLSearchParams();
  if (opts.employeeId !== undefined) qs.set("employeeId", String(opts.employeeId));
  if (opts.assetId !== undefined)    qs.set("assetId", String(opts.assetId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<Assignment[]>(`${SERVICE_URLS.workforce}/assignments${suffix}`);
}

export function createAssignment(body: Partial<Assignment>): Promise<Assignment> {
  return apiFetch<Assignment>(`${SERVICE_URLS.workforce}/assignments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function returnAssignment(id: number, returnedDate?: string): Promise<Assignment> {
  return apiFetch<Assignment>(`${SERVICE_URLS.workforce}/assignments/${id}/return`, {
    method: "POST",
    body: JSON.stringify(returnedDate ? { returnedDate } : {}),
  });
}
