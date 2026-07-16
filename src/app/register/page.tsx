import type { Metadata } from "next";
import { RegisterScreen } from "./register-screen";

export const unstable_instant = { prefetch: "static" };

export const metadata: Metadata = {
  title: "Register — Ratio Coffee POS",
};

export default function RegisterPage() {
  return <RegisterScreen />;
}
