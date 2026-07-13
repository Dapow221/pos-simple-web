import type { CartLine } from "@/store/pos";

export const TAX_RATE = 0.11;

export function rupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// Mirrors the backend: subtotal -> 11% tax -> rounded to the nearest Rp 100.
export function orderTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const grandTotal = Math.round((subtotal + tax) / 100) * 100;
  return { subtotal, tax, rounding: grandTotal - (subtotal + tax), grandTotal };
}

export function quickAmounts(total: number): number[] {
  const roundUpTo = (step: number) => Math.ceil(total / step) * step;
  return [...new Set([roundUpTo(5000), roundUpTo(50000), roundUpTo(100000)])].filter(
    (amount) => amount > total,
  );
}
