"use client";

import { useRouter } from "next/navigation";
import { ORDER_NUMBER } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { orderTotals, rupiah } from "@/lib/money";
import { usePosStore, type OrderType } from "@/store/pos";

const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: "dine-in", label: "Dine-in" },
  { id: "takeaway", label: "Takeaway" },
];

interface OrderTicketProps {
  className?: string;
  onClose?: () => void;
}

export function OrderTicket({ className, onClose }: OrderTicketProps) {
  const router = useRouter();
  const { orderType, lines, setOrderType, adjustQty, removeLine, clearOrder } =
    usePosStore();
  const { subtotal, tax, rounding, grandTotal } = orderTotals(lines);
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <aside className={cn("flex min-h-0 flex-col bg-cream px-5 py-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-[22px] font-semibold">Order {ORDER_NUMBER}</h2>
          <p className="mono-label mt-1">{itemCount} ITEMS · OPEN</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-line bg-white p-1">
            {ORDER_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setOrderType(type.id)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  orderType === type.id ? "bg-ink text-cream" : "text-muted hover:text-ink"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close ticket"
              className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-muted transition-colors hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 divide-y divide-line overflow-y-auto border-t-2 border-line">
        {lines.map((line) => (
          <div key={line.productId} className="py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-medium">{line.name}</p>
              <p className="font-mono text-sm">{rupiah(line.price * line.qty)}</p>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <p className="text-[13px] text-muted">
                {line.sku} · {rupiah(line.price)}
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => removeLine(line.productId)}
                  className="mono-label transition-colors hover:text-ink"
                >
                  Remove
                </button>
                <div className="flex items-center rounded-full border border-line bg-white">
                  <button
                    type="button"
                    onClick={() => adjustQty(line.productId, -1)}
                    className="px-3 py-1 text-muted hover:text-ink"
                    aria-label={`Remove one ${line.name}`}
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center text-sm">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => adjustQty(line.productId, 1)}
                    className="px-3 py-1 text-muted hover:text-ink"
                    aria-label={`Add one ${line.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {lines.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Ticket is empty — tap the menu to add items.
          </p>
        )}
      </div>

      <div className="space-y-1.5 border-t-2 border-line pt-4 text-sm">
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
        <span className="font-serif text-[22px] font-semibold">Total</span>
        <span className="font-mono text-xl font-medium">{rupiah(grandTotal)}</span>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={clearOrder}
          aria-label="Clear order"
          className="flex size-[52px] items-center justify-center rounded-[10px] border border-line bg-white text-muted transition-colors hover:text-ink"
        >
          🗑
        </button>
        <button
          type="button"
          disabled={lines.length === 0}
          onClick={() => router.push("/payment")}
          className="flex-1 rounded-[10px] bg-ink text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
        >
          Charge · {rupiah(grandTotal)}
        </button>
      </div>
    </aside>
  );
}
