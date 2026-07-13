import { useAuthStore } from "@/store/auth";

const API_BASE = "/api/v1";
// Proxied on its original path so the httpOnly refresh cookie's
// Path=/v1/auth attribute matches (see next.config.ts rewrites).
const AUTH_BASE = "/v1/auth";

export interface ApiUser {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  permissions: string[];
}

export interface LoginResponse {
  user: ApiUser;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
  payments: { method: "cash" | "card" | "qris"; amount: number }[];
}

export interface Receipt {
  id: string;
  receiptNo: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  tax: number;
  rounding: number;
  grandTotal: number;
  amountPaid: number;
  change: number;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

async function parseError(response: Response): Promise<never> {
  const body = await response.json().catch(() => null);
  const error = body?.error ?? {};
  throw new ApiError(
    response.status,
    error.code ?? "UNKNOWN",
    error.message ?? `Request failed with status ${response.status}`,
    error.details,
  );
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}

export async function refreshSession(): Promise<LoginResponse | null> {
  const response = await fetch(`${AUTH_BASE}/refresh`, { method: "POST" });
  if (!response.ok) return null;
  return (await response.json()).data;
}

export async function logout(): Promise<void> {
  await fetch(`${AUTH_BASE}/logout`, { method: "POST" });
}

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const request = (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const { accessToken, setSession, clearSession } = useAuthStore.getState();
  let response = await request(accessToken);
  if (response.status !== 401) return response;

  const renewed = await refreshSession();
  if (!renewed) {
    clearSession();
    throw new ApiError(401, "SESSION_EXPIRED", "Session expired — sign in again.");
  }
  setSession(renewed.user, renewed.accessToken);
  response = await request(renewed.accessToken);
  return response;
}

export async function getProducts(): Promise<Product[]> {
  const response = await authFetch("/products?limit=100");
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}

export async function checkout(
  payload: CheckoutPayload,
  idempotencyKey: string,
): Promise<Receipt> {
  const response = await authFetch("/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}
