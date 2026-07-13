"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { refreshSession } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// Guards a page: restores the session from the refresh cookie if needed,
// otherwise sends the user to the sign-in screen.
export function useRequireAuth(): boolean {
  const router = useRouter();
  const { accessToken, setSession } = useAuthStore();

  useEffect(() => {
    if (accessToken) return;
    let cancelled = false;
    void refreshSession().then((session) => {
      if (cancelled) return;
      if (session) setSession(session.user, session.accessToken);
      else router.replace("/sign-in");
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, setSession, router]);

  return accessToken !== null;
}
