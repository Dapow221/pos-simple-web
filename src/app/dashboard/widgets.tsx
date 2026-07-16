"use client";

import Link from "next/link";
import type {
  LowStockProduct,
  PaymentMethodStat,
  RecentTransaction,
  SalesSummary,
  TopProduct,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { rupiah, rupiahCompact } from "@/lib/money";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Debit / Credit",
  qris: "QRIS",
};

interface CardProps {
  title: string;
  meta?: string;
  className?: string;
  children: React.ReactNode;
}

export function Card({ title, meta, className, children }: CardProps) {
  return (
    <section className={cn("rounded-[14px] border border-line bg-white p-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        {meta && <span className="mono-label">{meta}</span>}
      </div>
      <div className="mt-4">{children}</div>
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

export function RecentSalesList({ transactions }: { transactions: RecentTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted">No transactions yet — ring one up!</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {transactions.map((tx) => (
        <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="font-mono text-sm">{tx.receiptNo}</p>
            <p className="text-xs text-muted">
              {formatWibTime(tx.createdAt)} · {tx.itemCount}{" "}
              {tx.itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <span className="font-mono text-sm tabular-nums">{rupiah(tx.grandTotal)}</span>
        </li>
      ))}
    </ul>
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
        reports. Switch to the Admin card on the sign-in screen (PIN 2026) to see
        revenue, best-sellers, and stock alerts.
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
