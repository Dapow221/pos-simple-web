"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeaderMeta, PosHeader, StaffBadge } from "@/components/pos-header";
import { getProducts, type Product } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/store/auth";
import { AdjustmentCard, GoodsInCard } from "./stock-forms";
import { MovementsCard } from "./movements-card";
import { OpnameCard } from "./opname-card";

export function InventoryScreen() {
  const isAuthed = useRequireAuth();
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState("");
  // Bumped after every stock mutation so products and the ledger refetch.
  const [refreshKey, setRefreshKey] = useState(0);

  const canManage = user?.permissions.includes("products:write") ?? false;

  useEffect(() => {
    if (!isAuthed || !canManage) return;
    let cancelled = false;
    getProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch((cause: Error) => {
        if (!cancelled) setLoadError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthed, canManage, refreshKey]);

  const refresh = () => setRefreshKey((key) => key + 1);

  return (
    <div className="flex min-h-dvh flex-col">
      <PosHeader subtitle="INVENTORY · STOCK">
        <HeaderMeta label="ADMIN" className="hidden sm:block">
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
              <p className="mono-label">目次 / Inventory</p>
              <h1 className="mt-1 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
                Stock in, counted, and accounted for
              </h1>
              <p className="mt-2 max-w-[640px] text-sm text-muted">
                Barang masuk, koreksi, dan stock opname — every movement lands on
                the kartu stok below, including sales from the register.
              </p>
            </div>

            {loadError && (
              <p className="mono-label mt-6 text-accent-bright">{loadError.toUpperCase()}</p>
            )}

            <div className="mt-6 space-y-4">
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <GoodsInCard products={products ?? []} onSaved={refresh} />
                <AdjustmentCard products={products ?? []} onSaved={refresh} />
              </div>
              <OpnameCard products={products ?? []} onApplied={refresh} />
              <MovementsCard products={products ?? []} refreshKey={refreshKey} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function AdminOnlyNotice({ signedInAs }: { signedInAs: string }) {
  return (
    <div className="mx-auto max-w-[560px] py-14 text-center sm:py-20">
      <p className="mono-label">ADMIN ONLY</p>
      <h1 className="mt-3 font-serif text-[28px] font-semibold tracking-tight sm:text-[34px]">
        Inventory needs admin access
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You&apos;re signed in as {signedInAs}, who can ring sales but can&apos;t move
        stock. Ask the manager to sign in for goods-in, opname, or corrections.
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
