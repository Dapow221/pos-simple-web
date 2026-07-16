import type { Metadata } from "next";
import { SignInScreen } from "./sign-in-screen";

export const unstable_instant = { prefetch: "static" };

export const metadata: Metadata = {
  title: "Sign in — Ratio Coffee POS",
};

export default function SignInPage() {
  return <SignInScreen />;
}
