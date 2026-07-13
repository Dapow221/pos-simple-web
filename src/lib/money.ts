import { MENU_BY_ID } from "./catalog";
import type { CartLine } from "@/store/pos";

export const TAX_RATE = 0.11;

export function rupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function orderTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => {
    const item = MENU_BY_ID.get(line.itemId);
    return sum + (item ? item.price * line.qty : 0);
  }, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, tax, total: subtotal + tax };
}

export function quickAmounts(total: number): number[] {
  const roundUpTo = (step: number) => Math.ceil(total / step) * step;
  return [...new Set([roundUpTo(5000), roundUpTo(50000), roundUpTo(100000)])].filter(
    (amount) => amount > total,
  );
}
