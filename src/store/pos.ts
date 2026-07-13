import { create } from "zustand";
import type { Product } from "@/lib/api";

export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  qty: number;
}

export type OrderType = "dine-in" | "takeaway";

interface PosState {
  orderType: OrderType;
  lines: CartLine[];
  setOrderType: (orderType: OrderType) => void;
  addItem: (product: Product) => void;
  adjustQty: (productId: string, delta: number) => void;
  removeLine: (productId: string) => void;
  clearOrder: () => void;
}

export const usePosStore = create<PosState>((set) => ({
  orderType: "dine-in",
  lines: [],
  setOrderType: (orderType) => set({ orderType }),
  addItem: (product) =>
    set((state) => {
      const existing = state.lines.find((line) => line.productId === product.id);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.productId === product.id
              ? { ...line, qty: Math.min(line.qty + 1, line.stock) }
              : line,
          ),
        };
      }
      const { id, ...snapshot } = product;
      return { lines: [...state.lines, { ...snapshot, productId: id, qty: 1 }] };
    }),
  adjustQty: (productId, delta) =>
    set((state) => ({
      lines: state.lines
        .map((line) =>
          line.productId === productId
            ? { ...line, qty: Math.min(line.qty + delta, line.stock) }
            : line,
        )
        .filter((line) => line.qty > 0),
    })),
  removeLine: (productId) =>
    set((state) => ({
      lines: state.lines.filter((line) => line.productId !== productId),
    })),
  clearOrder: () => set({ lines: [] }),
}));
