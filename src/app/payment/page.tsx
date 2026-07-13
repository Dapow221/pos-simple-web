"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Keypad } from "@/components/keypad";
import { HeaderMeta, PosHeader, StaffBadge } from "@/components/pos-header";
import { MENU_BY_ID, ORDER_NUMBER, STAFF } from "@/lib/catalog";
import { orderTotals, quickAmounts, rupiah } from "@/lib/money";
import { usePosStore } from "@/store/pos";

const PAYMENT_METHODS = [
  { id: "cash", name: "Cash", note: "Rupiah · drawer" },
  { id: "qris", name: "QRIS", note: "Scan to pay" },
  { id: "debit", name: "Debit / Credit", note: "EDC terminal" },
  { id: "e-wallet", name: "E-Wallet", note: "GoPay · OVO · Dana" },
];

export default function PaymentPage() {
  const router = useRouter();
  const { staffId, orderType, lines, clearOrder } = usePosStore();
  const [method, setMethod] = useState("cash");
  const [tendered, setTendered] = useState(0);

  const staff = STAFF.find((member) => member.id === staffId) ?? STAFF[0];
  const { total } = orderTotals(lines);
  const change = tendered - total;
  const isCash = method === "cash";
  const canComplete = lines.length > 0 && (!isCash || change >= 0);

  const handleDigit = (digit: string) =>
    setTendered((amount) => Math.min(amount * 10 + Number(digit), 99_999_999));

  const handleAction = (action: string) => {
    setTendered((amount) =>
      action === "000"
        ? Math.min(amount * 1000, 99_999_999)
        : Math.floor(amount / 10),
    );
  };

  const completeOrder = () => {
    clearOrder();
    router.push("/register");
  };

  return (
    <div className="flex h-dvh flex-col">
      <PosHeader subtitle="CHECKOUT · PAYMENT">
        <HeaderMeta label="ORDER">{ORDER_NUMBER}</HeaderMeta>
        <HeaderMeta label="ON BAR">
          <StaffBadge initials={staff.initials} name={staff.name} />
        </HeaderMeta>
      </PosHeader>

      <main className="grid min-h-0 flex-1 lg:grid-cols-[420px_1fr]">
        <OrderSummary orderTypeLabel={orderType === "dine-in" ? "DINE-IN" : "TAKEAWAY"} />

        <section className="min-h-0 overflow-y-auto px-10 py-7">
          <div className="max-w-[760px]">
            <Link href="/register" className="mono-label transition-colors hover:text-ink">
              ‹ BACK TO REGISTER
            </Link>
            <h1 className="mt-2 font-serif text-[30px] font-semibold tracking-tight">
              Take payment
            </h1>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((entry) => {
                const selected = entry.id === method;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setMethod(entry.id)}
                    className={`flex items-center gap-4 rounded-[10px] border p-4 text-left transition-colors ${
                      selected
                        ? "border-[1.5px] border-accent-bright bg-tint"
                        : "border-line bg-white hover:border-muted"
                    }`}
                  >
                    <span
                      className={`size-6 rounded-md border-[1.5px] ${
                        selected ? "border-accent-bright bg-white" : "border-ink/50"
                      }`}
                    />
                    <span>
                      <span className="block text-sm font-semibold">{entry.name}</span>
                      <span className="block text-xs text-muted">{entry.note}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex items-end justify-between">
              <p className="mono-label">AMOUNT DUE</p>
              <p className="font-serif text-[34px] font-medium leading-none">
                {rupiah(total)}
              </p>
            </div>

            <div className={`mt-4 ${isCash ? "" : "pointer-events-none opacity-40"}`}>
              <div className="flex flex-wrap gap-2">
                <QuickChip
                  active={tendered === total}
                  label={`Exact · ${rupiah(total)}`}
                  onClick={() => setTendered(total)}
                />
                {quickAmounts(total).map((amount) => (
                  <QuickChip
                    key={amount}
                    active={tendered === amount}
                    label={rupiah(amount)}
                    onClick={() => setTendered(amount)}
                  />
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-[10px] border border-line bg-white px-4 py-3">
                  <p className="mono-label text-[10px]">TENDERED</p>
                  <p className="mt-1 font-mono text-[22px] font-medium leading-none">
                    {rupiah(tendered)}
                  </p>
                </div>
                <div className="rounded-[10px] border-[1.5px] border-accent-bright bg-tint px-4 py-3">
                  <p className="mono-label text-[10px]">CHANGE</p>
                  <p className="mt-1 font-mono text-[22px] font-medium leading-none text-accent">
                    {rupiah(Math.max(change, 0))}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Keypad actionKeys={["000", "Del"]} onDigit={handleDigit} onAction={handleAction} />
              </div>
            </div>

            <button
              type="button"
              disabled={!canComplete}
              onClick={completeOrder}
              className="mt-5 w-full rounded-[10px] bg-ink py-4 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
            >
              {isCash && change > 0
                ? `Complete · give ${rupiah(change)} change`
                : `Complete · ${rupiah(total)}`}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

interface QuickChipProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function QuickChip({ active, label, onClick }: QuickChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
        active ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-muted"
      }`}
    >
      {label}
    </button>
  );
}

function OrderSummary({ orderTypeLabel }: { orderTypeLabel: string }) {
  const lines = usePosStore((state) => state.lines);
  const { subtotal, tax, total } = orderTotals(lines);

  return (
    <aside className="flex min-h-0 flex-col border-r border-line bg-white px-8 py-7">
      <div className="flex items-center justify-between">
        <p className="mono-label">ORDER SUMMARY</p>
        <span className="mono-label rounded-md border border-line px-2.5 py-1 text-[9px]">
          {orderTypeLabel}
        </span>
      </div>
      <h2 className="mt-2 font-serif text-[26px] font-semibold">Order {ORDER_NUMBER}</h2>

      <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto border-t border-line pt-5">
        {lines.map((line) => {
          const item = MENU_BY_ID.get(line.itemId);
          if (!item) return null;
          return (
            <div key={line.itemId} className="flex items-baseline justify-between gap-3">
              <div className="flex gap-3">
                <span className="font-mono text-xs text-accent">{line.qty}×</span>
                <div>
                  <p className="text-[15px] font-medium">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.note} · {rupiah(item.price)}
                  </p>
                </div>
              </div>
              <p className="font-mono text-sm">{rupiah(item.price * line.qty)}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span className="font-mono">{rupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Tax &amp; service · 11%</span>
          <span className="font-mono">{rupiah(tax)}</span>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-serif text-[22px] font-semibold">Total due</span>
        <span className="font-mono text-xl font-medium">{rupiah(total)}</span>
      </div>
    </aside>
  );
}
