import { create } from "zustand";

export interface CartLine {
  itemId: string;
  qty: number;
}

export type OrderType = "dine-in" | "takeaway";

const DEMO_ORDER: CartLine[] = [
  { itemId: "caffe-latte", qty: 2 },
  { itemId: "v60", qty: 1 },
  { itemId: "butter-croissant", qty: 1 },
];

interface PosState {
  staffId: string;
  orderType: OrderType;
  lines: CartLine[];
  signIn: (staffId: string) => void;
  setOrderType: (orderType: OrderType) => void;
  addItem: (itemId: string) => void;
  adjustQty: (itemId: string, delta: number) => void;
  removeLine: (itemId: string) => void;
  clearOrder: () => void;
}

export const usePosStore = create<PosState>((set) => ({
  staffId: "anya",
  orderType: "dine-in",
  lines: DEMO_ORDER,
  signIn: (staffId) => set({ staffId }),
  setOrderType: (orderType) => set({ orderType }),
  addItem: (itemId) =>
    set((state) => {
      const existing = state.lines.find((line) => line.itemId === itemId);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.itemId === itemId ? { ...line, qty: line.qty + 1 } : line,
          ),
        };
      }
      return { lines: [...state.lines, { itemId, qty: 1 }] };
    }),
  adjustQty: (itemId, delta) =>
    set((state) => ({
      lines: state.lines
        .map((line) =>
          line.itemId === itemId ? { ...line, qty: line.qty + delta } : line,
        )
        .filter((line) => line.qty > 0),
    })),
  removeLine: (itemId) =>
    set((state) => ({
      lines: state.lines.filter((line) => line.itemId !== itemId),
    })),
  clearOrder: () => set({ lines: [] }),
}));
