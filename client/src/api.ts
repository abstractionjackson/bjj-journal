import type { Partner, Session, SessionInput } from "./types";

const CREDS_KEY = "bjj-journal.credentials";

export function getCredentials(): string | null {
  return sessionStorage.getItem(CREDS_KEY);
}

export function setCredentials(user: string, pass: string): void {
  sessionStorage.setItem(CREDS_KEY, btoa(`${user}:${pass}`));
}

export function clearCredentials(): void {
  sessionStorage.removeItem(CREDS_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const creds = getCredentials();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (creds) headers.Authorization = `Basic ${creds}`;

  const res = await fetch(path, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) clearCredentials();
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.details);
  }
  return body as T;
}

export const api = {
  listSessions: () => request<Session[]>("/api/sessions"),
  getSession: (id: string) => request<Session>(`/api/sessions/${id}`),
  createSession: (input: SessionInput) =>
    request<Session>("/api/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateSession: (id: string, input: SessionInput) =>
    request<Session>(`/api/sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteSession: (id: string) =>
    request<void>(`/api/sessions/${id}`, { method: "DELETE" }),
  listPartners: () => request<Partner[]>("/api/partners"),
};
