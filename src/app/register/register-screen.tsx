"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderMeta, PosHeader, StaffBadge } from "@/components/pos-header";
import { OrderTicket } from "@/components/order-ticket";
import { getProducts, logout, type Product } from "@/lib/api";
import { OUTLET, skuCategory } from "@/lib/catalog";
import { rupiah } from "@/lib/money";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/store/auth";
import { usePosStore } from "@/store/pos";

const ALL_CATEGORY = "All";

export function RegisterScreen() {
  const router = useRouter();
  const isAuthed = useRequireAuth();
  const { user, clearSession } = useAuthStore();
  const addItem = usePosStore((state) => state.addItem);
  const lines = usePosStore((state) => state.lines);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [query, setQuery] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);

  useEffect(() => {
    if (!isAuthed) return;
    getProducts()
      .then(setProducts)
      .catch((error: Error) => setLoadError(error.message));
  }, [isAuthed]);

  const categories = [
    ALL_CATEGORY,
    ...new Set(products.map((product) => skuCategory(product.sku))),
  ];
  const items = products.filter(
    (product) =>
      (category === ALL_CATEGORY || skuCategory(product.sku) === category) &&
      product.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const ticketTotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const canViewReports = user?.permissions.includes("reports:read") ?? false;

  const lock = async () => {
    await logout();
    clearSession();
    router.push("/sign-in");
  };

  return (
    <div className="flex h-dvh flex-col">
      <PosHeader subtitle="REGISTER · BAR">
        <HeaderMeta label="OUTLET" className="hidden md:block">
          {OUTLET}
        </HeaderMeta>
        <HeaderMeta label="TIME" className="hidden sm:block">
          <Clock />
        </HeaderMeta>
        <HeaderMeta label="ON BAR" className="hidden md:block">
          <StaffBadge
            initials={initialsOf(user?.fullName ?? user?.email ?? "?")}
            name={user?.fullName ?? "—"}
          />
        </HeaderMeta>
        {canViewReports && (
          <Link
            href="/dashboard"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6"
          >
            Dashboard
          </Link>
        )}
        <button
          type="button"
          onClick={lock}
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-muted sm:px-6"
        >
          Lock
        </button>
      </PosHeader>

      <main className="grid min-h-0 flex-1 lg:grid-cols-[1fr_400px]">
        <section className="flex min-h-0 flex-col">
          <div className="flex items-center gap-4 overflow-x-auto border-b border-line px-4 py-3 sm:gap-6 sm:px-6">
            <nav className="flex items-center gap-4 whitespace-nowrap sm:gap-5">
              {categories.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setCategory(entry)}
                  className={`text-sm transition-colors ${
                    entry === category
                      ? "rounded-full bg-ink px-4 py-1.5 font-medium text-cream"
                      : "text-ink/80 hover:text-ink"
                  }`}
                >
                  {entry}
                </button>
              ))}
            </nav>
            <label className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-4 py-2">
              <span className="size-3 rounded-full border border-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search menu"
                className="w-24 bg-transparent text-sm outline-none placeholder:text-muted sm:w-36"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-28 sm:px-6 lg:pb-5">
            <div className="flex items-baseline justify-between">
              <h1 className="font-serif text-[24px] font-semibold sm:text-[28px]">
                {category === ALL_CATEGORY ? "All items" : category}
              </h1>
              <p className="mono-label">{items.length} ITEMS</p>
            </div>

            {loadError && (
              <p className="mono-label mt-6 text-accent-bright">{loadError}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {items.map((product) => {
                const soldOut = product.stock === 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => addItem(product)}
                    className="flex flex-col rounded-[10px] border border-line bg-white p-4 text-left transition-colors hover:border-muted disabled:opacity-50 disabled:hover:border-line"
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className="font-mono text-[11px] text-muted">
                        {product.sku}
                      </span>
                      {soldOut ? (
                        <span className="rounded-md border border-muted px-1.5 py-0.5 font-mono text-[9px] text-muted">
                          SOLD OUT
                        </span>
                      ) : (
                        product.stock <= 20 && (
                          <span className="rounded-md border border-accent-bright px-1.5 py-0.5 font-mono text-[9px] text-accent-bright">
                            LOW · {product.stock}
                          </span>
                        )
                      )}
                    </span>
                    <span className="mt-2 font-serif text-lg sm:text-xl">{product.name}</span>
                    <span className="mt-0.5 text-xs text-muted">
                      {skuCategory(product.sku)} · stock {product.stock}
                    </span>
                    <span className="mt-5 font-mono text-[13px]">
                      {rupiah(product.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <OrderTicket className="hidden border-l border-line lg:flex" />
      </main>

      {itemCount > 0 && !ticketOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setTicketOpen(true)}
            className="flex w-full items-center justify-between rounded-[10px] bg-ink px-5 py-3.5 text-cream"
          >
            <span className="text-sm font-semibold">
              {itemCount} {itemCount === 1 ? "item" : "items"} · View ticket
            </span>
            <span className="font-mono text-sm">{rupiah(ticketTotal)}</span>
          </button>
        </div>
      )}

      {ticketOpen && (
        <div role="dialog" aria-modal="true" aria-label="Order ticket" className="fixed inset-0 z-50 bg-cream lg:hidden">
          <OrderTicket className="h-full" onClose={() => setTicketOpen(false)} />
        </div>
      )}
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function Clock() {
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const format = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      );
    format();
    const interval = setInterval(format, 10_000);
    return () => clearInterval(interval);
  }, []);

  return <>{time}</>;
}
