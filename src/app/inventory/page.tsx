import type { Metadata } from "next";
import { InventoryScreen } from "./inventory-screen";

export const unstable_instant = { prefetch: "static" };

export const metadata: Metadata = {
  title: "Inventory — Ratio Coffee POS",
};

export default function InventoryPage() {
  return <InventoryScreen />;
}
