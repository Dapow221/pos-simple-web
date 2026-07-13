"use client";

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

export default function RegisterPage() {
  const router = useRouter();
  const isAuthed = useRequireAuth();
  const { user, clearSession } = useAuthStore();
  const addItem = usePosStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [query, setQuery] = useState("");

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

  const lock = async () => {
    await logout();
    clearSession();
    router.push("/sign-in");
  };

  return (
    <div className="flex h-dvh flex-col">
      <PosHeader subtitle="REGISTER · BAR">
        <HeaderMeta label="OUTLET">{OUTLET}</HeaderMeta>
        <HeaderMeta label="TIME">
          <Clock />
        </HeaderMeta>
        <HeaderMeta label="ON BAR">
          <StaffBadge
            initials={initialsOf(user?.fullName ?? user?.email ?? "?")}
            name={user?.fullName ?? "—"}
          />
        </HeaderMeta>
        <button
          type="button"
          onClick={lock}
          className="rounded-full border border-line bg-white px-6 py-2 text-sm font-medium transition-colors hover:border-muted"
        >
          Lock
        </button>
      </PosHeader>

      <main className="grid min-h-0 flex-1 grid-cols-[1fr_400px]">
        <section className="flex min-h-0 flex-col">
          <div className="flex items-center gap-6 border-b border-line px-6 py-3">
            <nav className="flex items-center gap-5">
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
            <label className="ml-auto flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2">
              <span className="size-3 rounded-full border border-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search menu"
                className="w-36 bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="flex items-baseline justify-between">
              <h1 className="font-serif text-[28px] font-semibold">
                {category === ALL_CATEGORY ? "All items" : category}
              </h1>
              <p className="mono-label">{items.length} ITEMS</p>
            </div>

            {loadError && (
              <p className="mono-label mt-6 text-accent-bright">{loadError}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
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
                    <span className="mt-2 font-serif text-xl">{product.name}</span>
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

        <OrderTicket />
      </main>
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
