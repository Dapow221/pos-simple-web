const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/v1";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

interface AuthPayload {
  user: AuthUser;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const err = body?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "UNKNOWN",
      err?.message ?? `Request failed (${res.status})`,
    );
  }

  return body?.data as T;
}

export function login(email: string, password: string) {
  return request<AuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Uses the httpOnly refresh_token cookie to mint a new access token.
export function refresh() {
  return request<AuthPayload>("/auth/refresh", { method: "POST" });
}

export function getMe(accessToken: string) {
  return request<AuthUser>("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function logout() {
  return request<null>("/auth/logout", { method: "POST" });
}
