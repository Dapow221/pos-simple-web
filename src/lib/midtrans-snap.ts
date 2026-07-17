/**
 * Midtrans Snap loader — the popup checkout that keeps the whole payment on
 * this page (no redirect to a gateway-hosted URL). The client key is public by
 * design; it must belong to the same environment as the server key, and the
 * script URL follows NEXT_PUBLIC_MIDTRANS_PRODUCTION.
 */

export interface SnapApi {
  pay(
    token: string,
    callbacks?: {
      onSuccess?: () => void;
      onPending?: () => void;
      onError?: () => void;
      onClose?: () => void;
    },
  ): void;
}

declare global {
  interface Window {
    snap?: SnapApi;
  }
}

export const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";

const SNAP_URL =
  process.env.NEXT_PUBLIC_MIDTRANS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

let snapPromise: Promise<SnapApi | null> | null = null;

/** Inject snap.js once and resolve with the Snap API (null if it can't load). */
export function loadSnap(): Promise<SnapApi | null> {
  if (!MIDTRANS_CLIENT_KEY) return Promise.resolve(null);
  if (window.snap) return Promise.resolve(window.snap);
  snapPromise ??= new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SNAP_URL;
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    script.onload = () => resolve(window.snap ?? null);
    script.onerror = () => {
      snapPromise = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return snapPromise;
}
