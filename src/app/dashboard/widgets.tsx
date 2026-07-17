"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getReportCashiers,
  getTransactions,
  type LowStockProduct,
  type PaymentMethodStat,
  type ReportCashier,
  type SalesSummary,
  type TopProduct,
  type TransactionFilters,
  type TransactionPage,
  type TransactionRow,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { rupiah, rupiahCompact } from "@/lib/money";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Debit / Credit",
  qris: "QRIS",
  midtrans: "Midtrans",
  xendit: "Xendit",
};

interface CardProps {
  title: string;
  meta?: string;
  className?: string;
  children: React.ReactNode;
}

export function Card({ title, meta, className, children }: CardProps) {
  return (
    <section
      className={cn("flex flex-col rounded-[14px] border border-line bg-white p-5", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        {meta && <span className="mono-label">{meta}</span>}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

export function KpiRow({ summary }: { summary: SalesSummary }) {
  const tiles = [
    {
      label: "GROSS REVENUE",
      value: rupiahCompact(summary.grossRevenue),
      full: rupiah(summary.grossRevenue),
      caption: "after discounts, incl. tax",
    },
    {
      label: "TRANSACTIONS",
      value: summary.transactions.toLocaleString("id-ID"),
      caption: "receipts settled",
    },
    {
      label: "ITEMS SOLD",
      value: summary.itemsSold.toLocaleString("id-ID"),
      caption: "cups, plates & more",
    },
    {
      label: "AVERAGE TICKET",
      value: rupiahCompact(summary.averageTicket),
      full: rupiah(summary.averageTicket),
      caption: "per transaction",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-[14px] border border-line bg-white p-4 sm:p-5">
            <p className="mono-label">{tile.label}</p>
            <p
              className="mt-2 font-mono text-lg font-semibold sm:text-2xl"
              title={tile.full}
            >
              {tile.value}
            </p>
            <p className="mt-1 text-xs text-muted">{tile.caption}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {rupiah(summary.discountTotal)} given in discounts · {rupiah(summary.taxTotal)} PPN
        collected in this range.
      </p>
    </div>
  );
}

export function PaymentMethodBars({ stats }: { stats: PaymentMethodStat[] }) {
  const sorted = [...stats].sort((a, b) => b.amount - a.amount);
  const max = Math.max(...sorted.map((s) => s.amount), 1);
  const total = sorted.reduce((sum, s) => sum + s.amount, 0);

  if (sorted.length === 0) {
    return <p className="text-sm text-muted">No payments in this range.</p>;
  }

  return (
    <div className="space-y-5">
      {sorted.map((stat) => (
        <div key={stat.method}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{METHOD_LABELS[stat.method] ?? stat.method}</span>
            <span className="font-mono">{rupiah(stat.amount)}</span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-tint">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max((stat.amount / max) * 100, 2)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            {stat.payments} {stat.payments === 1 ? "payment" : "payments"} ·{" "}
            {total > 0 ? Math.round((stat.amount / total) * 100) : 0}% of takings
          </p>
        </div>
      ))}
    </div>
  );
}

export function TopProductsList({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return <p className="text-sm text-muted">Nothing sold in this range yet.</p>;
  }
  return (
    <ol className="divide-y divide-line">
      {products.map((product, index) => (
        <li key={product.productId} className="flex items-center gap-4 py-3">
          <span className="w-7 shrink-0 font-serif text-lg leading-none text-accent">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted">
              {product.sku} · {product.quantitySold} sold
            </p>
          </div>
          <span className="font-mono text-sm tabular-nums">{rupiah(product.revenue)}</span>
        </li>
      ))}
    </ol>
  );
}

export function LowStockList({ items }: { items: LowStockProduct[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Nothing running low — shelves look good.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted">{item.sku}</p>
          </div>
          {item.stock === 0 ? (
            <span className="shrink-0 rounded-md border border-muted px-1.5 py-0.5 font-mono text-[9px] text-muted">
              SOLD OUT
            </span>
          ) : (
            <span className="shrink-0 rounded-md border border-accent-bright px-1.5 py-0.5 font-mono text-[9px] text-accent-bright">
              LOW · {item.stock} LEFT
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const TRANSACTIONS_PAGE_SIZE = 10;
const RECEIPT_DEBOUNCE_MS = 400;

export function LatestTransactionsCard() {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [receiptInput, setReceiptInput] = useState("");
  const [cashiers, setCashiers] = useState<ReportCashier[]>([]);
  // Results carry the request key that produced them, so loading is derived
  // and a stale response can never overwrite a newer page's rows.
  const requestKey = JSON.stringify({ page, filters });
  const [result, setResult] = useState<(TransactionPage & { key: string }) | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);

  useEffect(() => {
    getReportCashiers()
      .then(setCashiers)
      .catch(() => {
        // The dropdown just stays empty; the table still works.
      });
  }, []);

  // Receipt search is debounced so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const receipt = receiptInput.trim() || undefined;
      setFilters((current) => (current.receipt === receipt ? current : { ...current, receipt }));
      setPage(0);
    }, RECEIPT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [receiptInput]);

  useEffect(() => {
    let cancelled = false;
    getTransactions(TRANSACTIONS_PAGE_SIZE, page * TRANSACTIONS_PAGE_SIZE, filters)
      .then((data) => {
        if (!cancelled) setResult({ ...data, key: requestKey });
      })
      .catch((cause: Error) => {
        if (!cancelled) setFailure({ key: requestKey, message: cause.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const applyFilter = (patch: TransactionFilters) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  };
  const hasFilters = Boolean(filters.from || filters.to || filters.cashierId || filters.receipt);

  const error = failure?.key === requestKey ? failure.message : "";
  const loading = result?.key !== requestKey && !error;
  const total = result?.total ?? 0;
  const lastPage = Math.max(Math.ceil(total / TRANSACTIONS_PAGE_SIZE) - 1, 0);
  const from = total === 0 ? 0 : page * TRANSACTIONS_PAGE_SIZE + 1;
  const to = Math.min((page + 1) * TRANSACTIONS_PAGE_SIZE, total);

  const filterField =
    "rounded-[10px] border border-line bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent-bright";

  return (
    <Card
      title="Latest transactions"
      meta={result ? `${hasFilters ? "FILTERED" : "ALL TIME"} · ${total} RECEIPTS` : "LOADING…"}
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mono-label block text-[9px]">FROM</span>
          <input
            type="date"
            value={filters.from ?? ""}
            max={filters.to}
            onChange={(event) => applyFilter({ from: event.target.value || undefined })}
            className={cn(filterField, "mt-1.5")}
          />
        </label>
        <label className="block">
          <span className="mono-label block text-[9px]">TO</span>
          <input
            type="date"
            value={filters.to ?? ""}
            min={filters.from}
            onChange={(event) => applyFilter({ to: event.target.value || undefined })}
            className={cn(filterField, "mt-1.5")}
          />
        </label>
        <label className="block">
          <span className="mono-label block text-[9px]">CASHIER</span>
          <select
            value={filters.cashierId ?? ""}
            onChange={(event) => applyFilter({ cashierId: event.target.value || undefined })}
            className={cn(filterField, "mt-1.5")}
          >
            <option value="">All cashiers</option>
            {cashiers.map((cashier) => (
              <option key={cashier.id} value={cashier.id}>
                {cashier.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[180px] flex-1">
          <span className="mono-label block text-[9px]">RECEIPT NO</span>
          <input
            type="search"
            placeholder="Search e.g. RCP-MRNS"
            value={receiptInput}
            onChange={(event) => setReceiptInput(event.target.value)}
            className={cn(filterField, "mt-1.5 w-full font-mono")}
          />
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setReceiptInput("");
              setFilters({});
              setPage(0);
            }}
            className="rounded-full border border-line bg-white px-4 py-2 font-mono text-xs transition-colors hover:border-muted"
          >
            Clear ×
          </button>
        )}
      </div>

      {error && <p className="mono-label text-accent-bright">{error.toUpperCase()}</p>}
      {!result && !error && (
        <div className="h-64 animate-pulse rounded-[10px] border border-line" aria-hidden />
      )}
      {result && (
        <div className={cn("transition-opacity", loading && "pointer-events-none opacity-60")}>
          <TransactionsTable transactions={result.rows} filtered={hasFilters} />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="mono-label">
              {total === 0 ? "NO RECEIPTS" : `SHOWING ${from}–${to} OF ${total}`}
            </span>
            <div className="flex gap-2">
              <PagerButton
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
              >
                ‹ Prev
              </PagerButton>
              <span className="mono-label self-center">
                PAGE {Math.min(page, lastPage) + 1} / {lastPage + 1}
              </span>
              <PagerButton
                disabled={page >= lastPage}
                onClick={() => setPage((current) => Math.min(current + 1, lastPage))}
              >
                Next ›
              </PagerButton>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

interface PagerButtonProps {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function PagerButton({ disabled, onClick, children }: PagerButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-line bg-white px-4 py-1.5 font-mono text-xs transition-colors hover:border-muted disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

interface TransactionsTableProps {
  transactions: TransactionRow[];
  filtered: boolean;
}

function TransactionsTable({ transactions, filtered }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted">
        {filtered
          ? "Nothing matches these filters — try widening them."
          : "No transactions yet — ring one up!"}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[10px] border border-line">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {["RECEIPT", "TIME · WIB", "CASHIER", "ITEMS", "PAID VIA", "TOTAL"].map((label) => (
              <th key={label} className="mono-label px-4 py-3 font-normal">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="px-4 py-3 font-mono text-xs">{tx.receiptNo}</td>
              <td className="px-4 py-3 text-xs text-muted">{formatWibTime(tx.createdAt)}</td>
              <td className="px-4 py-3">{tx.cashierName ?? "—"}</td>
              <td className="px-4 py-3 tabular-nums">{tx.itemCount}</td>
              <td className="px-4 py-3">
                <span className="flex flex-wrap gap-1">
                  {tx.methods.length === 0 && <span className="text-muted">—</span>}
                  {tx.methods.map((method) => (
                    <span
                      key={method}
                      className="mono-label rounded-md border border-line px-1.5 py-0.5 text-[9px]"
                    >
                      {(METHOD_LABELS[method] ?? method).toUpperCase()}
                    </span>
                  ))}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {rupiah(tx.grandTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ManagerOnlyNotice({ signedInAs }: { signedInAs: string }) {
  return (
    <div className="mx-auto max-w-[560px] py-14 text-center sm:py-20">
      <p className="mono-label">MANAGER ONLY</p>
      <h1 className="mt-3 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
        The dashboard needs manager access
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You&apos;re signed in as {signedInAs}, who can ring sales but can&apos;t read
        reports. Switch to the Admin Toko card on the sign-in screen (PIN 2026)
        to see revenue, best-sellers, and stock alerts.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-[10px] bg-ink px-6 py-3 text-sm font-semibold text-cream"
        >
          Switch account
        </Link>
        <Link
          href="/register"
          className="rounded-[10px] border border-line bg-white px-6 py-3 text-sm font-medium transition-colors hover:border-muted"
        >
          Back to the register
        </Link>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-4" aria-hidden>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[14px] border border-line bg-white" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-[14px] border border-line bg-white lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-[14px] border border-line bg-white" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-[14px] border border-line bg-white" />
        ))}
      </div>
    </div>
  );
}

function formatWibTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
