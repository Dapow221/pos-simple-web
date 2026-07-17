"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeaderMeta, PosHeader, StaffBadge } from "@/components/pos-header";
import { getFinanceSummary, type FinanceSummary, type ReportRange } from "@/lib/api";
import { cn } from "@/lib/cn";
import { rupiah, rupiahCompact } from "@/lib/money";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/store/auth";
import { ExpensesCard, NewExpenseCard } from "./expense-cards";

const RANGE_PRESETS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

function jakartaRange(days: number): ReportRange {
  const wibDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
  const now = Date.now();
  return {
    from: wibDate.format(new Date(now - (days - 1) * 86_400_000)),
    to: wibDate.format(new Date(now)),
  };
}

export function FinanceScreen() {
  const isAuthed = useRequireAuth();
  const user = useAuthStore((state) => state.user);
  const [days, setDays] = useState(30);
  // Bumped after expense writes so the recap refetches alongside the list.
  const [refreshKey, setRefreshKey] = useState(0);
  const requestKey = JSON.stringify({ days, refreshKey });
  const [result, setResult] = useState<{
    key: string;
    range: ReportRange;
    summary: FinanceSummary;
  } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);

  const canManage = user?.permissions.includes("finance:manage") ?? false;

  useEffect(() => {
    if (!isAuthed || !canManage) return;
    let cancelled = false;
    const range = jakartaRange(days);
    getFinanceSummary(range)
      .then((summary) => {
        if (!cancelled) setResult({ key: requestKey, range, summary });
      })
      .catch((cause: Error) => {
        if (!cancelled) setFailure({ key: requestKey, message: cause.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, canManage, requestKey]);

  const error = failure?.key === requestKey ? failure.message : "";
  const loading = result?.key !== requestKey && !error;
  const summary = result?.summary ?? null;

  return (
    <div className="flex min-h-dvh flex-col">
      <PosHeader subtitle="PEMBUKUAN · MONEY">
        <HeaderMeta label="ADMIN" className="hidden sm:block">
          <StaffBadge
            initials={(user?.fullName ?? "?").slice(0, 2).toUpperCase()}
            name={user?.fullName ?? "—"}
          />
        </HeaderMeta>
        <Link
          href="/dashboard"
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6"
        >
          Dashboard
        </Link>
      </PosHeader>

      <main className="mx-auto w-full max-w-[1140px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {isAuthed && user && !canManage ? (
          <AdminOnlyNotice signedInAs={user.fullName ?? user.email} />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="mono-label">目次 / Pembukuan</p>
                <h1 className="mt-1 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
                  Where the money went
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

            {error && <p className="mono-label mt-6 text-accent-bright">{error.toUpperCase()}</p>}
            {!summary && !error && (
              <div className="mt-6 h-40 animate-pulse rounded-[14px] border border-line bg-white" />
            )}

            {summary && (
              <div
                className={cn(
                  "mt-6 space-y-4 transition-opacity",
                  loading && "pointer-events-none opacity-60",
                )}
              >
                <RecapTiles summary={summary} range={result?.range ?? null} />

                <div className="grid items-start gap-4 lg:grid-cols-[400px_1fr]">
                  <div className="space-y-4">
                    <NewExpenseCard onSaved={() => setRefreshKey((key) => key + 1)} />
                    <CategoryCard summary={summary} />
                  </div>
                  <ExpensesCard
                    refreshKey={refreshKey}
                    onChanged={() => setRefreshKey((key) => key + 1)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function RecapTiles({ summary, range }: { summary: FinanceSummary; range: ReportRange | null }) {
  const tiles = [
    { label: "OMSET · REVENUE", value: summary.revenue, tone: "" },
    { label: "PENGELUARAN · EXPENSES", value: summary.expenses, tone: "text-accent-bright" },
    { label: "LABA · NET", value: summary.net, tone: "text-accent" },
  ];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-[14px] border border-line bg-white p-4 sm:p-5">
            <p className="mono-label">{tile.label}</p>
            <p
              className={cn("mt-2 font-mono text-lg font-semibold sm:text-2xl", tile.tone)}
              title={rupiah(tile.value)}
            >
              {rupiahCompact(tile.value)}
            </p>
          </div>
        ))}
      </div>
      {range && (
        <p className="mt-2 text-xs text-muted">
          {range.from} → {range.to} · WIB. Laba = omset − pengeluaran tercatat (belum
          termasuk HPP otomatis).
        </p>
      )}
    </div>
  );
}

function CategoryCard({ summary }: { summary: FinanceSummary }) {
  const max = Math.max(...summary.byCategory.map((c) => c.amount), 1);
  return (
    <section className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">By category</h2>
        <span className="mono-label">THIS RANGE</span>
      </div>
      <div className="mt-4 space-y-4">
        {summary.byCategory.length === 0 && (
          <p className="text-sm text-muted">No expenses recorded in this range yet.</p>
        )}
        {summary.byCategory.map((entry) => (
          <div key={entry.category}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{entry.category}</span>
              <span className="font-mono">{rupiah(entry.amount)}</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-tint">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max((entry.amount / max) * 100, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminOnlyNotice({ signedInAs }: { signedInAs: string }) {
  return (
    <div className="mx-auto max-w-[560px] py-14 text-center sm:py-20">
      <p className="mono-label">ADMIN ONLY</p>
      <h1 className="mt-3 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
        Pembukuan needs admin access
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You&apos;re signed in as {signedInAs}. Ask the manager to sign in to record
        expenses or read the books. (Managers: re-login once after the update so
        your session picks up the finance permission.)
      </p>
      <Link
        href="/register"
        className="mt-6 inline-block rounded-[10px] bg-ink px-6 py-3 text-sm font-semibold text-cream"
      >
        Back to the register
      </Link>
    </div>
  );
}
