import type { Metadata } from "next";
import { DashboardScreen } from "./dashboard-screen";

export const unstable_instant = { prefetch: "static" };

export const metadata: Metadata = {
  title: "Dashboard — Ratio Coffee POS",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
