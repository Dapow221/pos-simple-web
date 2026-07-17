import type { Metadata } from "next";
import { StaffScreen } from "./staff-screen";

export const unstable_instant = { prefetch: "static" };

export const metadata: Metadata = {
  title: "Staff — Ratio Coffee POS",
};

export default function StaffPage() {
  return <StaffScreen />;
}
