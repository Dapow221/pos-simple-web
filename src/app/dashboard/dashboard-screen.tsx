"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderMeta, PosHeader, StaffBadge } from "@/components/pos-header";
import {
  getLowStock,
  getPaymentMethods,
  getSalesByDay,
  getSummary,
  getTopProducts,
  logout,
  type DailySales,
  type LowStockProduct,
  type PaymentMethodStat,
  type ReportRange,
  type SalesSummary,
  type TopProduct,
} from "@/lib/api";
import { OUTLET } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/store/auth";
import { SalesChart } from "./sales-chart";
import {
  Card,
  DashboardSkeleton,
  KpiRow,
  LatestTransactionsCard,
  LowStockList,
  ManagerOnlyNotice,
  PaymentMethodBars,
  TodayStrip,
  TopProductsList,
} from "./widgets";

const RANGE_PRESETS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

interface DashboardData {
  summary: SalesSummary;
  today: SalesSummary;
  daily: DailySales[];
  topProducts: TopProduct[];
  methods: PaymentMethodStat[];
  lowStock: LowStockProduct[];
}

// Report days are bucketed in the shop's timezone (Asia/Jakarta), so the
// range is computed there too — not in the browser's local zone.
function jakartaRange(days: number): ReportRange {
  const wibDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
  const now = Date.now();
  return {
    from: wibDate.format(new Date(now - (days - 1) * 86_400_000)),
    to: wibDate.format(new Date(now)),
  };
}

export function DashboardScreen() {
  const router = useRouter();
  const isAuthed = useRequireAuth();
  const { user, clearSession } = useAuthStore();
  const [days, setDays] = useState(30);
  const [reloadKey, setReloadKey] = useState(0);
  // Results carry the stamp of the request that produced them, so loading and
  // error states are derived instead of set synchronously in the effect — and
  // stale responses can never overwrite a newer range's data.
  const [snapshot, setSnapshot] = useState<{
    stamp: string;
    range: ReportRange;
    data: DashboardData;
  } | null>(null);
  const [failure, setFailure] = useState<{ stamp: string; message: string } | null>(null);

  const canView = user?.permissions.includes("reports:read") ?? false;
  const stamp = `${days}:${reloadKey}`;

  useEffect(() => {
    if (!isAuthed || !canView) return;
    let cancelled = false;
    // The clock is read inside the effect: doing it during render would block
    // the prerendered static shell that makes navigating here instant.
    const range = jakartaRange(days);
    Promise.all([
      getSummary(range),
      getSummary(jakartaRange(1)),
      getSalesByDay(range),
      getTopProducts(range),
      getPaymentMethods(range),
      getLowStock(),
    ])
      .then(([summary, today, daily, topProducts, methods, lowStock]) => {
        if (cancelled) return;
        setSnapshot({
          stamp,
          range,
          data: { summary, today, daily, topProducts, methods, lowStock },
        });
      })
      .catch((cause: Error) => {
        if (!cancelled) setFailure({ stamp, message: cause.message });
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthed, canView, stamp, days]);

  const data = snapshot?.data ?? null;
  const range = snapshot?.range ?? null;
  const error = failure?.stamp === stamp ? failure.message : "";
  const loading = snapshot?.stamp !== stamp && !error;

  const lock = async () => {
    await logout();
    clearSession();
    router.push("/sign-in");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PosHeader subtitle="DASHBOARD · REPORTS">
        <HeaderMeta label="OUTLET" className="hidden md:block">
          {OUTLET}
        </HeaderMeta>
        <HeaderMeta label="MANAGER" className="hidden sm:block">
          <StaffBadge
            initials={(user?.fullName ?? "?").slice(0, 2).toUpperCase()}
            name={user?.fullName ?? "—"}
          />
        </HeaderMeta>
        {user?.permissions.includes("products:write") && (
          <Link
            href="/inventory"
            className="hidden rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6 md:block"
          >
            Stock
          </Link>
        )}
        {user?.permissions.includes("finance:manage") && (
          <Link
            href="/finance"
            className="hidden rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6 md:block"
          >
            Books
          </Link>
        )}
        {user?.permissions.includes("users:manage") && (
          <Link
            href="/staff"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6"
          >
            Staff
          </Link>
        )}
        <Link
          href="/register"
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6"
        >
          Register
        </Link>
        <button
          type="button"
          onClick={lock}
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6"
        >
          Lock
        </button>
      </PosHeader>

      <main className="mx-auto w-full max-w-[1140px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {isAuthed && user && !canView ? (
          <ManagerOnlyNotice signedInAs={user.fullName ?? user.email} />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="mono-label">目次 / Reports</p>
                <h1 className="mt-1 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
                  How the bar is doing
                </h1>
              </div>
              <div className="flex gap-2" role="group" aria-label="Date range">
                {RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setDays(preset.days)}
                    aria-pressed={days === preset.days}
                    className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
                      days === preset.days
                        ? "border-ink bg-ink text-cream"
                        : "border-line bg-white hover:border-muted"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-6">
                <p className="mono-label text-accent-bright">{error.toUpperCase()}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="mt-3 rounded-[10px] border border-line bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:border-muted"
                >
                  Try again
                </button>
              </div>
            )}

            {!data && !error && <DashboardSkeleton />}

            {data && (
              <div
                className={cn(
                  "mt-6 space-y-4 transition-opacity",
                  loading && "pointer-events-none opacity-60",
                )}
              >
                <TodayStrip summary={data.today} />

                <KpiRow summary={data.summary} />

                {/* No items-start here: both cards stretch to the same height,
                    and the chart grows to fill its card. */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card
                    title="Revenue by day"
                    meta={range ? `${range.from} → ${range.to} · WIB` : undefined}
                    className="lg:col-span-2"
                  >
                    <SalesChart data={data.daily} />
                  </Card>
                  <Card title="Payment methods" meta="SHARE OF TAKINGS">
                    <PaymentMethodBars stats={data.methods} />
                  </Card>
                </div>

                <div className="grid items-start gap-4 lg:grid-cols-2">
                  <Card title="Best sellers" meta="BY REVENUE">
                    <TopProductsList products={data.topProducts} />
                  </Card>
                  <Card title="Running low" meta="RESTOCK ALERTS">
                    <LowStockList items={data.lowStock} />
                  </Card>
                </div>

                <LatestTransactionsCard />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
