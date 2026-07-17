"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Keypad } from "@/components/keypad";
import { ApiError, getStaffWithPin, login, pinLogin, type ApiUser, type StaffUser } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const PIN_LENGTH = 4;

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SignInScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [staff, setStaff] = useState<StaffUser[] | null>(null);
  const [staffError, setStaffError] = useState("");
  const [staffId, setStaffId] = useState<string | null>(null);
  const [mode, setMode] = useState<"pin" | "email">("pin");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let cancelled = false;
    getStaffWithPin()
      .then((users) => {
        if (cancelled) return;
        setStaff(users);
        if (users.length === 0) setMode("email");
      })
      .catch((cause: Error) => {
        if (cancelled) return;
        setStaff([]);
        setMode("email");
        setStaffError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = staff?.find((member) => member.id === staffId) ?? staff?.[0] ?? null;

  // Navigation keeps this screen mounted (Activity), so reset local state
  // before leaving — otherwise "Lock" returns to a stale, stuck PIN pad.
  const enterSession = (user: ApiUser, accessToken: string) => {
    setPin("");
    setStatus("idle");
    setSession(user, accessToken);
    router.push(user.permissions.includes("reports:read") ? "/dashboard" : "/register");
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH || status === "checking" || !selected) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setStatus("idle");
    if (nextPin.length === PIN_LENGTH) void unlock(nextPin);
  };

  const unlock = async (enteredPin: string) => {
    if (!selected) return;
    setStatus("checking");
    try {
      const session = await pinLogin(selected.id, enteredPin);
      enterSession(session.user, session.accessToken);
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

        {mode === "email" ? (
          <EmailSignIn
            onSession={enterSession}
            onUsePin={staff && staff.length > 0 ? () => setMode("pin") : null}
          />
        ) : (
          <>
            <p className="mono-label mt-6 sm:mt-8">WHO&apos;S ON THE BAR?</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {staff === null &&
                Array.from({ length: 3 }, (_, index) => (
                  <span
                    key={index}
                    className="h-[52px] w-40 animate-pulse rounded-full border border-line bg-white"
                    aria-hidden
                  />
                ))}
              {staff?.map((member) => {
                const isSelected = member.id === selected?.id;
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
                      isSelected
                        ? "border-accent-bright bg-tint"
                        : "border-line bg-white hover:border-muted"
                    }`}
                  >
                    <span
                      className={`flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-white ${
                        isSelected ? "bg-accent-bright" : "bg-ink"
                      }`}
                    >
                      {initials(member.fullName)}
                    </span>
                    <span className="text-left">
                      <span className="block text-sm font-semibold">{member.fullName}</span>
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
                {(selected?.fullName ?? "STAFF").toUpperCase()} · ENTER PIN
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
              Demo PINs — Anya Putri 1234 · Admin Toko 2026 (manager). PINs are
              managed in Dashboard → Staff.{" "}
              <button
                type="button"
                onClick={() => setMode("email")}
                className="font-medium text-ink underline underline-offset-2"
              >
                Sign in with email instead
              </button>
            </p>
          </>
        )}

        {staffError && (
          <p className="mono-label mt-4 text-accent-bright">
            STAFF LIST UNAVAILABLE — {staffError.toUpperCase()}
          </p>
        )}

        <footer className="mono-label mt-auto flex items-center justify-between pt-10">
          <span>RATIO POS V1.5</span>
          <span>LAST SYNC · 06:58</span>
        </footer>
      </section>
    </main>
  );
}

interface EmailSignInProps {
  onSession: (user: ApiUser, accessToken: string) => void;
  onUsePin: (() => void) | null;
}

function EmailSignIn({ onSession, onUsePin }: EmailSignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [errorText, setErrorText] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setErrorText("");
    try {
      const session = await login(email, password);
      setEmail("");
      setPassword("");
      setChecking(false);
      onSession(session.user, session.accessToken);
    } catch (error) {
      setErrorText(
        error instanceof ApiError && error.status === 429
          ? "TOO MANY TRIES · WAIT A MINUTE"
          : "WRONG EMAIL OR PASSWORD",
      );
      setChecking(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 max-w-[420px] sm:mt-8">
      <p className="mono-label">SIGN IN WITH EMAIL</p>
      <label className="mt-4 block">
        <span className="mono-label block text-[9px]">EMAIL</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-accent-bright"
        />
      </label>
      <label className="mt-4 block">
        <span className="mono-label block text-[9px]">PASSWORD</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-accent-bright"
        />
      </label>

      {errorText && <p className="mono-label mt-4 text-accent-bright">{errorText}</p>}

      <button
        type="submit"
        disabled={checking}
        className="mt-5 w-full rounded-[10px] bg-ink py-4 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
      >
        {checking ? "Signing in…" : "Sign in"}
      </button>

      <p className="mt-4 text-sm text-muted">
        Demo admin — <span className="font-mono">admin@pos.test</span> ·{" "}
        <span className="font-mono">Admin123!</span>
      </p>

      {onUsePin && (
        <button
          type="button"
          onClick={onUsePin}
          className="mono-label mt-4 block underline underline-offset-2 transition-colors hover:text-ink"
        >
          USE A STAFF PIN INSTEAD
        </button>
      )}
    </form>
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
        <Image
          src="/logo-cream.png"
          alt="Ratio Coffee cat logo"
          width={65}
          height={80}
          className="mb-6 h-20 w-auto"
        />
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
