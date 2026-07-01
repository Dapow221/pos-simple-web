"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, logout, refresh } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function HomePage() {
  const router = useRouter();
  const { user, accessToken, setAuth, clear } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user && accessToken) {
      setReady(true);
      return;
    }
    // No in-memory session (e.g. after reload) — try the refresh cookie.
    (async () => {
      try {
        const payload = await refresh();
        const me = payload.user ?? (await getMe(payload.accessToken));
        setAuth(me, payload.accessToken);
        setReady(true);
      } catch {
        router.replace("/login");
      }
    })();
  }, [user, accessToken, setAuth, router]);

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      clear();
      router.replace("/login");
    }
  };

  if (!ready || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <section className="w-full max-w-[440px] rounded-2xl bg-white p-10 shadow-[0_12px_32px_rgba(17,24,39,0.08)]">
        <h1 className="text-[26px] font-bold tracking-tight text-gray-900">
          Welcome, {user.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">You are signed in to the POS.</p>

        <dl className="mt-6 flex flex-col gap-3 rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Role</dt>
            <dd className="font-medium capitalize text-gray-900">{user.role}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Permissions</dt>
            <dd className="text-right font-medium text-gray-900">
              {user.permissions.join(", ") || "—"}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onLogout}
          className="mt-6 h-[52px] w-full rounded-[10px] bg-indigo-600 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
