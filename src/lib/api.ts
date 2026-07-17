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

export interface ReportRange {
  from: string;
  to: string;
}

export interface SalesSummary {
  transactions: number;
  grossRevenue: number;
  itemsSold: number;
  discountTotal: number;
  taxTotal: number;
  averageTicket: number;
}

export interface DailySales {
  date: string;
  transactions: number;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  sku: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export type PaymentMethod = "cash" | "card" | "qris";

export interface PaymentMethodStat {
  // cash/card/qris from the counter, midtrans/xendit from the gateway.
  method: string;
  payments: number;
  amount: number;
}

export interface LowStockProduct {
  id: string;
  sku: string;
  name: string;
  stock: number;
}

export interface RecentTransaction {
  id: string;
  receiptNo: string;
  cashierId: string;
  grandTotal: number;
  itemCount: number;
  createdAt: string;
}

export interface TransactionRow {
  id: string;
  receiptNo: string;
  cashierName: string | null;
  grandTotal: number;
  itemCount: number;
  methods: string[];
  createdAt: string;
}

export interface StaffUser {
  id: string;
  fullName: string;
  role: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  hasPin: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password: string;
  role: "cashier" | "admin";
  pin?: string;
}

export type GatewayProvider = "midtrans" | "xendit";
export type GatewayStatus = "pending" | "paid" | "failed" | "expired";

export interface GatewayPayment {
  id: string;
  provider: GatewayProvider;
  status: GatewayStatus;
  amount: number;
  paymentUrl: string | null;
  providerRef: string | null;
  externalRef: string;
  transactionId: string | null;
  createdAt: string;
  paidAt: string | null;
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

/** The lock screen's staff picker — public, shown before anyone signs in. */
export async function getStaffWithPin(): Promise<StaffUser[]> {
  const response = await fetch(`${API_BASE}/users/with-pin`);
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}

export async function pinLogin(userId: string, pin: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_BASE}/pin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, pin }),
  });
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
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

async function getReport<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const response = await authFetch(`/reports/${path}${query ? `?${query}` : ""}`);
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}

export const getSummary = (range: ReportRange) =>
  getReport<SalesSummary>("summary", { ...range });

export const getSalesByDay = (range: ReportRange) =>
  getReport<DailySales[]>("sales-by-day", { ...range });

export const getTopProducts = (range: ReportRange, limit = 8) =>
  getReport<TopProduct[]>("top-products", { ...range, limit: String(limit) });

export const getPaymentMethods = (range: ReportRange) =>
  getReport<PaymentMethodStat[]>("payment-methods", { ...range });

export const getLowStock = (threshold = 10) =>
  getReport<LowStockProduct[]>("low-stock", { threshold: String(threshold) });

export const getRecentTransactions = (limit = 8) =>
  getReport<RecentTransaction[]>("recent-transactions", { limit: String(limit) });

export async function getUsers(): Promise<AdminUser[]> {
  const response = await authFetch("/users");
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}

export async function createUser(payload: CreateUserPayload): Promise<AdminUser> {
  const response = await authFetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}

export async function setUserPin(userId: string, pin: string): Promise<void> {
  const response = await authFetch(`/users/${userId}/pin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!response.ok) await parseError(response);
}

export interface TransactionPage {
  rows: TransactionRow[];
  total: number;
}

export interface TransactionFilters {
  /** Inclusive store-time dates, YYYY-MM-DD. */
  from?: string;
  to?: string;
  cashierId?: string;
  /** Substring match on the receipt number. */
  receipt?: string;
}

export interface ReportCashier {
  id: string;
  fullName: string;
}

/** One page of the dashboard's transaction log, newest first. */
export async function getTransactions(
  limit: number,
  offset: number,
  filters: TransactionFilters = {},
): Promise<TransactionPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const response = await authFetch(`/reports/transactions?${params}`);
  if (!response.ok) await parseError(response);
  const body = await response.json();
  return { rows: body.data, total: body.meta.total };
}

/** Everyone who has rung a sale — options for the cashier filter. */
export async function getReportCashiers(): Promise<ReportCashier[]> {
  const response = await authFetch("/reports/cashiers");
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}

export async function createGatewayPayment(
  payload: {
    provider: GatewayProvider;
    items: { productId: string; quantity: number }[];
    customerEmail?: string;
  },
  idempotencyKey: string,
): Promise<GatewayPayment> {
  const response = await authFetch("/payments", {
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

export async function getGatewayPayment(id: string): Promise<GatewayPayment> {
  const response = await authFetch(`/payments/${id}`);
  if (!response.ok) await parseError(response);
  return (await response.json()).data;
}

/** Dev-only helper: the backend hides this endpoint outside development. */
export async function simulateGatewayPaid(id: string): Promise<GatewayPayment> {
  const response = await authFetch(`/payments/${id}/simulate`, { method: "POST" });
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
