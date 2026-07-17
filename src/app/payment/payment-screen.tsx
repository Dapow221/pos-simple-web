"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Keypad } from "@/components/keypad";
import { HeaderMeta, PosHeader, StaffBadge } from "@/components/pos-header";
import { ApiError, checkout, type GatewayProvider, type Receipt } from "@/lib/api";
import { ORDER_NUMBER } from "@/lib/catalog";
import { orderTotals, quickAmounts, rupiah } from "@/lib/money";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/store/auth";
import { usePosStore } from "@/store/pos";
import { GatewayCheckout } from "./gateway-checkout";

const PAYMENT_METHODS = [
  { id: "cash", name: "Cash", note: "Rupiah · drawer", apiMethod: "cash" },
  { id: "qris", name: "QRIS", note: "Scan to pay", apiMethod: "qris" },
  { id: "debit", name: "Debit / Credit", note: "EDC terminal", apiMethod: "card" },
  { id: "midtrans", name: "Online · Midtrans", note: "GoPay · VA · cards, on this screen", apiMethod: null },
  { id: "xendit", name: "Online · Xendit", note: "E-wallets · invoice, on this screen", apiMethod: null },
] as const;

export function PaymentScreen() {
  const router = useRouter();
  useRequireAuth();
  const user = useAuthStore((state) => state.user);
  const { orderType, lines, clearOrder } = usePosStore();
  const [methodId, setMethodId] = useState<string>("cash");
  const [tendered, setTendered] = useState(0);
  // Created lazily at submit and reused on retry, so a network blip can never
  // charge twice. Kept out of render: random values during render would block
  // the prerendered static shell that makes navigating here instant.
  const idempotencyKeyRef = useRef("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [gatewayProvider, setGatewayProvider] = useState<GatewayProvider | null>(null);

  const method = PAYMENT_METHODS.find((entry) => entry.id === methodId) ?? PAYMENT_METHODS[0];
  const { grandTotal } = orderTotals(lines);
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const change = tendered - grandTotal;
  const isCash = method.id === "cash";
  const isGateway = method.apiMethod === null;
  const canComplete =
    lines.length > 0 && (!isCash || change >= 0) && !submitting && !receipt;
  const canViewReports = user?.permissions.includes("reports:read") ?? false;

  const handleDigit = (digit: string) =>
    setTendered((amount) => Math.min(amount * 10 + Number(digit), 99_999_999));

  const handleAction = (action: string) => {
    setTendered((amount) =>
      action === "000"
        ? Math.min(amount * 1000, 99_999_999)
        : Math.floor(amount / 10),
    );
  };

  const completeOrder = async () => {
    if (method.apiMethod === null) {
      // Online payment: the gateway panel owns creation, polling, and receipt.
      setSubmitError("");
      setGatewayProvider(method.id);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
    try {
      const paid = await checkout(
        {
          items: lines.map((line) => ({ productId: line.productId, quantity: line.qty })),
          payments: [{ method: method.apiMethod, amount: isCash ? tendered : grandTotal }],
        },
        idempotencyKeyRef.current,
      );
      setReceipt(paid);
    } catch (error) {
      if (error instanceof ApiError && error.code === "INSUFFICIENT_STOCK") {
        setSubmitError("NOT ENOUGH STOCK — ADJUST THE TICKET AND TRY AGAIN");
      } else {
        setSubmitError((error as Error).message.toUpperCase());
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation keeps this screen mounted (Activity), so reset local state too.
  const startNewOrder = () => {
    clearOrder();
    idempotencyKeyRef.current = "";
    setReceipt(null);
    setGatewayProvider(null);
    setTendered(0);
    setSubmitError("");
    router.push("/register");
  };

  return (
    <div className="flex h-dvh flex-col">
      <PosHeader subtitle="CHECKOUT · PAYMENT">
        <HeaderMeta label="ORDER" className="hidden sm:block">
          {ORDER_NUMBER}
        </HeaderMeta>
        <HeaderMeta label="ON BAR">
          <StaffBadge
            initials={(user?.fullName ?? "?").slice(0, 2).toUpperCase()}
            name={user?.fullName ?? "—"}
          />
        </HeaderMeta>
      </PosHeader>

      <main className="grid min-h-0 flex-1 lg:grid-cols-[420px_1fr]">
        <OrderSummary orderTypeLabel={orderType === "dine-in" ? "DINE-IN" : "TAKEAWAY"} />

        <section className="min-h-0 overflow-y-auto px-5 py-6 sm:px-10 sm:py-7">
          {receipt ? (
            <ReceiptView
              receipt={receipt}
              onNewOrder={startNewOrder}
              showDashboardLink={canViewReports}
            />
          ) : gatewayProvider ? (
            <GatewayCheckout
              provider={gatewayProvider}
              items={lines.map((line) => ({ productId: line.productId, quantity: line.qty }))}
              onNewOrder={startNewOrder}
              onBack={() => setGatewayProvider(null)}
              showDashboardLink={canViewReports}
            />
          ) : (
            <div className="max-w-[760px]">
              <Link href="/register" className="mono-label transition-colors hover:text-ink">
                ‹ BACK TO REGISTER
              </Link>
              <h1 className="mt-2 font-serif text-[26px] font-semibold tracking-tight sm:text-[30px]">
                Take payment
              </h1>

              <div className="mt-4 flex items-center justify-between rounded-[10px] border border-line bg-white px-4 py-3 lg:hidden">
                <span className="mono-label">
                  ORDER {ORDER_NUMBER} · {itemCount} ITEMS
                </span>
                <span className="font-mono text-sm font-medium">{rupiah(grandTotal)}</span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-6">
                {PAYMENT_METHODS.map((entry, index) => {
                  const selected = entry.id === method.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setMethodId(entry.id)}
                      className={`flex items-center gap-4 rounded-[10px] border p-4 text-left transition-colors ${
                        index < 3 ? "sm:col-span-2" : "sm:col-span-3"
                      } ${
                        selected
                          ? "border-[1.5px] border-accent-bright bg-tint"
                          : "border-line bg-white hover:border-muted"
                      }`}
                    >
                      <span
                        className={`size-6 shrink-0 rounded-md border-[1.5px] ${
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

              <div className="mt-7 flex items-end justify-between gap-4">
                <p className="mono-label">AMOUNT DUE</p>
                <p className="font-serif text-[28px] font-medium leading-none sm:text-[34px]">
                  {rupiah(grandTotal)}
                </p>
              </div>

              <div
                className={`mt-4 ${isGateway ? "hidden" : ""} ${
                  isCash ? "" : "pointer-events-none opacity-40"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  <QuickChip
                    active={tendered === grandTotal}
                    label={`Exact · ${rupiah(grandTotal)}`}
                    onClick={() => setTendered(grandTotal)}
                  />
                  {quickAmounts(grandTotal).map((amount) => (
                    <QuickChip
                      key={amount}
                      active={tendered === amount}
                      label={rupiah(amount)}
                      onClick={() => setTendered(amount)}
                    />
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-[10px] border border-line bg-white px-4 py-3">
                    <p className="mono-label text-[10px]">TENDERED</p>
                    <p className="mt-1 font-mono text-lg font-medium leading-none sm:text-[22px]">
                      {rupiah(tendered)}
                    </p>
                  </div>
                  <div className="rounded-[10px] border-[1.5px] border-accent-bright bg-tint px-4 py-3">
                    <p className="mono-label text-[10px]">CHANGE</p>
                    <p className="mt-1 font-mono text-lg font-medium leading-none text-accent sm:text-[22px]">
                      {rupiah(Math.max(change, 0))}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Keypad actionKeys={["000", "Del"]} onDigit={handleDigit} onAction={handleAction} />
                </div>
              </div>

              {submitError && (
                <p className="mono-label mt-4 text-accent-bright">{submitError}</p>
              )}

              <button
                type="button"
                disabled={!canComplete}
                onClick={completeOrder}
                className="mt-5 w-full rounded-[10px] bg-ink py-4 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
              >
                {submitting
                  ? "Processing…"
                  : isGateway
                    ? `Continue online · ${rupiah(grandTotal)}`
                    : isCash && change > 0
                      ? `Complete · give ${rupiah(change)} change`
                      : `Complete · ${rupiah(grandTotal)}`}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

interface ReceiptViewProps {
  receipt: Receipt;
  onNewOrder: () => void;
  showDashboardLink: boolean;
}

function ReceiptView({ receipt, onNewOrder, showDashboardLink }: ReceiptViewProps) {
  return (
    <div className="max-w-[560px]">
      <p className="mono-label">目次 / Receipt</p>
      <h1 className="mt-2 font-serif text-[26px] font-semibold tracking-tight sm:text-[30px]">
        Payment settled
      </h1>
      <div className="mt-5 rounded-[10px] border border-line bg-white p-6">
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <span className="mono-label">RECEIPT NO</span>
          <span className="font-mono text-lg">{receipt.receiptNo}</span>
        </div>
        {(
          [
            ["Subtotal", receipt.subtotal],
            ["Tax · 11%", receipt.tax],
            ["Rounding", receipt.rounding],
            ["Paid", receipt.amountPaid],
          ] as const
        ).map(([label, amount]) => (
          <div key={label} className="mt-3 flex justify-between text-sm text-muted">
            <span>{label}</span>
            <span className="font-mono">{rupiah(amount)}</span>
          </div>
        ))}
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-serif text-[22px] font-semibold">Change</span>
          <span className="font-mono text-xl font-medium text-accent">
            {rupiah(receipt.change)}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onNewOrder}
        className="mt-5 w-full rounded-[10px] bg-ink py-4 text-sm font-semibold text-cream"
      >
        New order
      </button>
      {showDashboardLink && (
        <Link
          href="/dashboard"
          className="mono-label mt-4 block text-center transition-colors hover:text-ink"
        >
          SEE IT LAND ON THE DASHBOARD ↗
        </Link>
      )}
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
  const { subtotal, tax, rounding, grandTotal } = orderTotals(lines);

  return (
    <aside className="hidden min-h-0 flex-col border-r border-line bg-white px-8 py-7 lg:flex">
      <div className="flex items-center justify-between">
        <p className="mono-label">ORDER SUMMARY</p>
        <span className="mono-label rounded-md border border-line px-2.5 py-1 text-[9px]">
          {orderTypeLabel}
        </span>
      </div>
      <h2 className="mt-2 font-serif text-[26px] font-semibold">Order {ORDER_NUMBER}</h2>

      <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto border-t border-line pt-5">
        {lines.map((line) => (
          <div key={line.productId} className="flex items-baseline justify-between gap-3">
            <div className="flex gap-3">
              <span className="font-mono text-xs text-accent">{line.qty}×</span>
              <div>
                <p className="text-[15px] font-medium">{line.name}</p>
                <p className="text-xs text-muted">
                  {line.sku} · {rupiah(line.price)}
                </p>
              </div>
            </div>
            <p className="font-mono text-sm">{rupiah(line.price * line.qty)}</p>
          </div>
        ))}
        {lines.length === 0 && (
          <p className="text-sm text-muted">
            No open ticket — head back to the register.
          </p>
        )}
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
        {rounding !== 0 && (
          <div className="flex justify-between text-muted">
            <span>Rounding</span>
            <span className="font-mono">{rupiah(rounding)}</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-serif text-[22px] font-semibold">Total due</span>
        <span className="font-mono text-xl font-medium">{rupiah(grandTotal)}</span>
      </div>
    </aside>
  );
}
