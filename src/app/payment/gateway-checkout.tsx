"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  createGatewayPayment,
  getGatewayPayment,
  simulateGatewayPaid,
  type GatewayPayment,
  type GatewayProvider,
} from "@/lib/api";
import { loadSnap, MIDTRANS_CLIENT_KEY } from "@/lib/midtrans-snap";
import { rupiah } from "@/lib/money";

const POLL_INTERVAL_MS = 3000;

const PROVIDER_LABELS: Record<GatewayProvider, string> = {
  midtrans: "Midtrans",
  xendit: "Xendit",
};

interface GatewayCheckoutProps {
  provider: GatewayProvider;
  items: { productId: string; quantity: number }[];
  onNewOrder: () => void;
  onBack: () => void;
  showDashboardLink: boolean;
}

export function GatewayCheckout({
  provider,
  items,
  onNewOrder,
  onBack,
  showDashboardLink,
}: GatewayCheckoutProps) {
  // Results carry the attempt that produced them (same pattern as the
  // dashboard), so switching attempts needs no synchronous state reset and a
  // stale response can never overwrite a newer attempt.
  const [result, setResult] = useState<{
    attempt: number;
    payment?: GatewayPayment;
    error?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // One idempotency key per attempt: a network retry replays the same payment,
  // an explicit "try again" (after expiry/failure) creates a fresh one.
  const idempotencyKeyRef = useRef("");
  const snapOpenedRef = useRef(false);

  const usesSnapPopup = provider === "midtrans" && MIDTRANS_CLIENT_KEY !== "";

  useEffect(() => {
    let cancelled = false;
    idempotencyKeyRef.current = crypto.randomUUID();
    snapOpenedRef.current = false;
    createGatewayPayment({ provider, items }, idempotencyKeyRef.current)
      .then((created) => {
        if (!cancelled) setResult({ attempt, payment: created });
      })
      .catch((cause: Error) => {
        if (!cancelled) setResult({ attempt, error: cause.message.toUpperCase() });
      });
    return () => {
      cancelled = true;
    };
    // items is stable for the life of this screen: the ticket can't change mid-payment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, attempt]);

  const current = result?.attempt === attempt ? result : null;
  const payment = current?.payment ?? null;
  const errorText = current?.error ?? "";
  const setPayment = (next: GatewayPayment) => setResult({ attempt, payment: next });

  const openSnapPopup = (token: string) => {
    void loadSnap().then((snap) => {
      // Server state is the only truth: callbacks just nudge an early poll.
      snap?.pay(token, {});
    });
  };

  useEffect(() => {
    if (!payment || payment.status !== "pending") return;
    if (usesSnapPopup && payment.providerRef && !snapOpenedRef.current) {
      snapOpenedRef.current = true;
      openSnapPopup(payment.providerRef);
    }
    const timer = setInterval(() => {
      getGatewayPayment(payment.id)
        .then(setPayment)
        .catch(() => {
          // Transient polling errors are ignored; the next tick retries.
        });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment?.id, payment?.status, usesSnapPopup]);

  if (errorText) {
    return (
      <Shell title="Online payment">
        <p className="mono-label mt-5 text-accent-bright">{errorText}</p>
        <div className="mt-5 flex gap-3">
          <ActionButton onClick={() => setAttempt((n) => n + 1)}>Try again</ActionButton>
          <ActionButton onClick={onBack} secondary>
            Back to methods
          </ActionButton>
        </div>
      </Shell>
    );
  }

  if (!payment) {
    return (
      <Shell title="Online payment">
        <p className="mono-label mt-5">
          CREATING {PROVIDER_LABELS[provider].toUpperCase()} PAYMENT…
        </p>
        <div className="mt-4 h-40 animate-pulse rounded-[10px] border border-line bg-white" />
      </Shell>
    );
  }

  if (payment.status === "paid") {
    return (
      <div className="max-w-[560px]">
        <p className="mono-label">目次 / Receipt</p>
        <h1 className="mt-2 font-serif text-[26px] font-semibold tracking-tight sm:text-[30px]">
          Payment settled
        </h1>
        <div className="mt-5 rounded-[10px] border border-line bg-white p-6">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <span className="mono-label">PAID VIA</span>
            <span className="text-sm font-semibold">{PROVIDER_LABELS[payment.provider]}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-muted">
            <span>Reference</span>
            <span className="font-mono text-xs">{payment.externalRef}</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-serif text-[22px] font-semibold">Paid</span>
            <span className="font-mono text-xl font-medium text-accent">
              {rupiah(payment.amount)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onNewOrder}
          className="mt-5 w-full rounded-[10px] bg-ink py-4 text-sm font-semibold text-cream"
        >
          New order
        </button>
        {showDashboardLink && (
          <Link
            href="/dashboard"
            className="mono-label mt-4 block text-center transition-colors hover:text-ink"
          >
            SEE IT LAND ON THE DASHBOARD ↗
          </Link>
        )}
      </div>
    );
  }

  if (payment.status === "expired" || payment.status === "failed") {
    return (
      <Shell title="Online payment">
        <p className="mono-label mt-5 text-accent-bright">
          PAYMENT {payment.status.toUpperCase()} — NO MONEY WAS TAKEN
        </p>
        <div className="mt-5 flex gap-3">
          <ActionButton onClick={() => setAttempt((n) => n + 1)}>
            Create a new payment
          </ActionButton>
          <ActionButton onClick={onBack} secondary>
            Back to methods
          </ActionButton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={`Pay with ${PROVIDER_LABELS[provider]}`}>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="mono-label">AMOUNT DUE</p>
        <p className="font-serif text-[28px] font-medium leading-none sm:text-[34px]">
          {rupiah(payment.amount)}
        </p>
      </div>

      {usesSnapPopup ? (
        <div className="mt-5 rounded-[10px] border border-line bg-white p-6">
          <p className="text-sm">
            The {PROVIDER_LABELS[provider]} popup is open on this screen — hand the
            terminal to the customer to finish paying.
          </p>
          <ActionButton
            className="mt-4"
            onClick={() => payment.providerRef && openSnapPopup(payment.providerRef)}
          >
            Reopen payment popup
          </ActionButton>
        </div>
      ) : (
        payment.paymentUrl && (
          <div className="mt-5 overflow-hidden rounded-[10px] border border-line bg-white">
            <iframe
              src={payment.paymentUrl}
              title={`${PROVIDER_LABELS[provider]} payment`}
              className="h-[560px] w-full"
            />
          </div>
        )
      )}

      <p className="mono-label mt-4">
        WAITING FOR PAYMENT · CHECKING EVERY {POLL_INTERVAL_MS / 1000}S
      </p>

      {process.env.NODE_ENV === "development" && (
        <ActionButton
          className="mt-4"
          secondary
          onClick={() => {
            simulateGatewayPaid(payment.id).then(setPayment).catch(() => {});
          }}
        >
          Simulate paid · dev only
        </ActionButton>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mono-label mt-6 block underline underline-offset-2 transition-colors hover:text-ink"
      >
        ‹ CHOOSE ANOTHER METHOD
      </button>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-[760px]">
      <h1 className="font-serif text-[26px] font-semibold tracking-tight sm:text-[30px]">
        {title}
      </h1>
      {children}
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  secondary?: boolean;
  className?: string;
}

function ActionButton({ onClick, children, secondary, className }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-colors ${
        secondary
          ? "border border-line bg-white font-medium hover:border-muted"
          : "bg-ink text-cream"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
