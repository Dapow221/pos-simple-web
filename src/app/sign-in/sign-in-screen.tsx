"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Keypad } from "@/components/keypad";
import { ApiError, login } from "@/lib/api";
import { pinPassword, STAFF } from "@/lib/catalog";
import { useAuthStore } from "@/store/auth";

const PIN_LENGTH = 4;

export function SignInScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [staffId, setStaffId] = useState(STAFF[0].id);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const staff = STAFF.find((member) => member.id === staffId) ?? STAFF[0];

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH || status === "checking") return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setStatus("idle");
    if (nextPin.length === PIN_LENGTH) void unlock(nextPin);
  };

  const unlock = async (enteredPin: string) => {
    setStatus("checking");
    try {
      const session = await login(staff.email, pinPassword(staff, enteredPin));
      setSession(session.user, session.accessToken);
      router.push(session.user.permissions.includes("reports:read") ? "/dashboard" : "/register");
    } catch (error) {
      setErrorText(
        error instanceof ApiError && error.status === 429
          ? "TOO MANY TRIES · WAIT A MINUTE"
          : "WRONG PIN · TRY AGAIN",
      );
      setStatus("error");
      setTimeout(() => setPin(""), 450);
    }
  };

  const handleAction = (action: string) => {
    if (status === "checking") return;
    setStatus("idle");
    setPin(action === "Clear" ? "" : pin.slice(0, -1));
  };

  return (
    <main className="grid flex-1 lg:grid-cols-[2fr_3fr]">
      <BrandPanel />

      <section className="flex flex-col px-5 py-8 sm:px-12 sm:py-10">
        <p className="mono-label">目次 / Sign in</p>
        <h1 className="mt-2 border-b border-line pb-5 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
          Open the register
        </h1>

        <p className="mono-label mt-6 sm:mt-8">WHO&apos;S ON THE BAR?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {STAFF.map((member) => {
            const selected = member.id === staffId;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setStaffId(member.id);
                  setPin("");
                  setStatus("idle");
                }}
                className={`flex items-center gap-3 rounded-full border py-2 pl-2 pr-6 transition-colors ${
                  selected
                    ? "border-accent-bright bg-tint"
                    : "border-line bg-white hover:border-muted"
                }`}
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-white ${
                    selected ? "bg-accent-bright" : "bg-ink"
                  }`}
                >
                  {member.initials}
                </span>
                <span className="text-left">
                  <span className="block text-sm font-semibold">{member.name}</span>
                  <span className="mono-label block text-[9px]">
                    {member.role.toUpperCase()}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-9 flex items-center justify-between gap-4">
          <p className="mono-label">
            {staff.shortName.toUpperCase()} · ENTER PIN
            {status === "checking" && <span className="ml-3 text-accent">UNLOCKING…</span>}
            {status === "error" && (
              <span className="ml-3 text-accent-bright">{errorText}</span>
            )}
          </p>
          <div className="flex shrink-0 gap-3">
            {Array.from({ length: PIN_LENGTH }, (_, index) => (
              <span
                key={index}
                className={`size-3 rounded-full border ${
                  index < pin.length
                    ? "border-accent-bright bg-accent-bright"
                    : "border-muted/60"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 max-w-[640px]">
          <Keypad actionKeys={["Clear", "Del"]} onDigit={handleDigit} onAction={handleAction} />
        </div>

        <p className="mt-5 max-w-[640px] text-sm text-muted">
          Demo PINs — Anya 1234 · Bima 2580 · Rama 0000 · Admin 2026. The
          manager account also opens the sales dashboard.
        </p>

        <footer className="mono-label mt-auto flex items-center justify-between pt-10">
          <span>RATIO POS V1.5</span>
          <span>LAST SYNC · 06:58</span>
        </footer>
      </section>
    </main>
  );
}

function BrandPanel() {
  return (
    <aside className="hidden flex-col bg-ink px-11 py-10 text-cream lg:flex">
      <div className="flex items-start justify-between">
        <p className="mono-label text-cream/50">No. 014 — STAFF TERMINAL</p>
        <div className="text-right">
          <p className="font-serif text-[40px] leading-[1.35]">
            珈琲
            <br />店
          </p>
          <p className="mono-label mt-3 text-accent-bright">RATIO</p>
        </div>
      </div>

      <div className="mt-24">
        <h2 className="font-serif text-[64px] leading-[1.08]">
          Ratio
          <br />
          <span className="text-accent-bright">Coffee</span>
        </h2>
        <p className="mt-5 max-w-[280px] text-[15px] leading-relaxed text-cream/60">
          Point of sale for the bar. Sign in to open the register, pull shots,
          and ring the queue.
        </p>
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-6 border-t border-cream/15 pt-6">
        {[
          ["OUTLET", "Senopati · Jakarta"],
          ["SHIFT", "Morning · 07–15"],
          ["CURRENCY", "IDR · Rupiah"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="mono-label text-cream/40">{label}</dt>
            <dd className="mt-1.5 text-sm text-cream/90">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
