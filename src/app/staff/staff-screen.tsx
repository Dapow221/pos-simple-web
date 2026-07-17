"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeaderMeta, PosHeader, StaffBadge } from "@/components/pos-header";
import {
  ApiError,
  createUser,
  getUsers,
  setUserPin,
  type AdminUser,
  type CreateUserPayload,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/store/auth";

const PIN_PATTERN = /^\d{4}$/;

export function StaffScreen() {
  const isAuthed = useRequireAuth();
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = user?.permissions.includes("users:manage") ?? false;

  useEffect(() => {
    if (!isAuthed || !canManage) return;
    let cancelled = false;
    getUsers()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch((cause: Error) => {
        if (!cancelled) setLoadError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthed, canManage, reloadKey]);

  const refresh = () => setReloadKey((key) => key + 1);

  return (
    <div className="flex min-h-dvh flex-col">
      <PosHeader subtitle="STAFF · ACCOUNTS & PINS">
        <HeaderMeta label="MANAGER" className="hidden sm:block">
          <StaffBadge
            initials={(user?.fullName ?? "?").slice(0, 2).toUpperCase()}
            name={user?.fullName ?? "—"}
          />
        </HeaderMeta>
        <Link
          href="/dashboard"
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6"
        >
          Dashboard
        </Link>
      </PosHeader>

      <main className="mx-auto w-full max-w-[1140px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {isAuthed && user && !canManage ? (
          <AdminOnlyNotice signedInAs={user.fullName ?? user.email} />
        ) : (
          <>
            <div className="border-b border-line pb-5">
              <p className="mono-label">目次 / Staff</p>
              <h1 className="mt-1 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
                Who can open the register
              </h1>
              <p className="mt-2 max-w-[640px] text-sm text-muted">
                Create accounts for the bar and give each one a 4-digit PIN — every
                account with a PIN shows up on the sign-in screen.
              </p>
            </div>

            <div className="mt-6 grid items-start gap-4 lg:grid-cols-[400px_1fr]">
              <CreateStaffCard onCreated={refresh} />

              <section className="rounded-[14px] border border-line bg-white p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-serif text-xl font-semibold">Accounts</h2>
                  <span className="mono-label">
                    {users ? `${users.length} TOTAL` : "LOADING…"}
                  </span>
                </div>

                {loadError && (
                  <div className="mt-4">
                    <p className="mono-label text-accent-bright">{loadError.toUpperCase()}</p>
                    <button
                      type="button"
                      onClick={refresh}
                      className="mt-3 rounded-[10px] border border-line bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:border-muted"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!users && !loadError && (
                  <div className="mt-4 space-y-3" aria-hidden>
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-[10px] border border-line" />
                    ))}
                  </div>
                )}

                {users && (
                  <ul className="mt-2 divide-y divide-line">
                    {users.map((account) => (
                      <StaffRow key={account.id} account={account} onPinSaved={refresh} />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CreateStaffCard({ onCreated }: { onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CreateUserPayload["role"]>("cashier");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [savedName, setSavedName] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pin && !PIN_PATTERN.test(pin)) {
      setErrorText("PIN MUST BE EXACTLY 4 DIGITS");
      return;
    }
    setSaving(true);
    setErrorText("");
    setSavedName("");
    try {
      const created = await createUser({
        fullName,
        email,
        password,
        role,
        ...(pin ? { pin } : {}),
      });
      setSavedName(created.fullName);
      setFullName("");
      setEmail("");
      setPassword("");
      setPin("");
      setRole("cashier");
      onCreated();
    } catch (error) {
      setErrorText(
        error instanceof ApiError && error.status === 409
          ? "THAT EMAIL IS ALREADY REGISTERED"
          : (error as Error).message.toUpperCase(),
      );
    } finally {
      setSaving(false);
    }
  };

  const field =
    "mt-1.5 w-full rounded-[10px] border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-accent-bright";

  return (
    <section className="rounded-[14px] border border-line bg-white p-5">
      <h2 className="font-serif text-xl font-semibold">New staff account</h2>
      <form onSubmit={submit} className="mt-4">
        <label className="block">
          <span className="mono-label block text-[9px]">FULL NAME</span>
          <input
            required
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={field}
          />
        </label>
        <label className="mt-4 block">
          <span className="mono-label block text-[9px]">EMAIL</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={field}
          />
        </label>
        <label className="mt-4 block">
          <span className="mono-label block text-[9px]">PASSWORD · MIN 8 CHARACTERS</span>
          <input
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={field}
          />
        </label>

        <div className="mt-4 grid grid-cols-2 items-end gap-3">
          <label className="block">
            <span className="mono-label block text-[9px]">ROLE</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as CreateUserPayload["role"])}
              className={cn(field, "h-[46px]")}
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="block">
            <span className="mono-label block text-[9px]">PIN · OPTIONAL</span>
            <input
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="4 digits"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              className={cn(field, "h-[46px]")}
            />
          </label>
        </div>

        {errorText && <p className="mono-label mt-4 text-accent-bright">{errorText}</p>}
        {savedName && (
          <p className="mono-label mt-4 text-accent">{savedName.toUpperCase()} CAN NOW SIGN IN</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 w-full rounded-[10px] bg-ink py-4 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create account"}
        </button>
      </form>
    </section>
  );
}

function StaffRow({ account, onPinSaved }: { account: AdminUser; onPinSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");

  const savePin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!PIN_PATTERN.test(pin)) {
      setErrorText("PIN MUST BE EXACTLY 4 DIGITS");
      return;
    }
    setSaving(true);
    setErrorText("");
    try {
      await setUserPin(account.id, pin);
      setEditing(false);
      setPin("");
      onPinSaved();
    } catch (error) {
      setErrorText((error as Error).message.toUpperCase());
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{account.fullName}</p>
          <p className="truncate text-xs text-muted">{account.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="mono-label rounded-md border border-line px-2 py-0.5 text-[9px]">
            {account.role.toUpperCase()}
          </span>
          {account.hasPin ? (
            <span className="mono-label rounded-md border border-accent-bright px-2 py-0.5 text-[9px] text-accent-bright">
              PIN SET
            </span>
          ) : (
            <span className="mono-label rounded-md border border-muted px-2 py-0.5 text-[9px] text-muted">
              NO PIN
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setEditing((open) => !open);
              setPin("");
              setErrorText("");
            }}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:border-muted"
          >
            {editing ? "Cancel" : account.hasPin ? "Replace PIN" : "Set PIN"}
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={savePin} className="mt-3 flex items-center gap-2">
          <input
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            autoFocus
            placeholder="4-digit PIN"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
            className="w-36 rounded-[10px] border border-line bg-white px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-accent-bright"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-ink px-4 py-2 text-xs font-semibold text-cream transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {errorText && <span className="mono-label text-accent-bright">{errorText}</span>}
        </form>
      )}
    </li>
  );
}

function AdminOnlyNotice({ signedInAs }: { signedInAs: string }) {
  return (
    <div className="mx-auto max-w-[560px] py-14 text-center sm:py-20">
      <p className="mono-label">ADMIN ONLY</p>
      <h1 className="mt-3 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
        Staff management needs admin access
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You&apos;re signed in as {signedInAs}, who can ring sales but can&apos;t manage
        accounts. Ask the manager to sign in to create staff or change PINs.
      </p>
      <Link
        href="/register"
        className="mt-6 inline-block rounded-[10px] bg-ink px-6 py-3 text-sm font-semibold text-cream"
      >
        Back to the register
      </Link>
    </div>
  );
}
