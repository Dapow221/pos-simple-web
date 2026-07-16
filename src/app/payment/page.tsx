import type { Metadata } from "next";
import { PaymentScreen } from "./payment-screen";

export const unstable_instant = { prefetch: "static" };

export const metadata: Metadata = {
  title: "Payment — Ratio Coffee POS",
};

export default function PaymentPage() {
  return <PaymentScreen />;
}
