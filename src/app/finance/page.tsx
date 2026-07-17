import type { Metadata } from "next";
import { FinanceScreen } from "./finance-screen";

export const unstable_instant = { prefetch: "static" };

export const metadata: Metadata = {
  title: "Pembukuan — Ratio Coffee POS",
};

export default function FinancePage() {
  return <FinanceScreen />;
}
