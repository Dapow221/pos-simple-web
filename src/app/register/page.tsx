"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeaderMeta, PosHeader, StaffBadge } from "@/components/pos-header";
import { OrderTicket } from "@/components/order-ticket";
import {
  CATEGORIES,
  categoryCount,
  MENU,
  OUTLET,
  STAFF,
  type CategoryId,
} from "@/lib/catalog";
import { rupiah } from "@/lib/money";
import { usePosStore } from "@/store/pos";

export default function RegisterPage() {
  const staffId = usePosStore((state) => state.staffId);
  const addItem = usePosStore((state) => state.addItem);
  const [category, setCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");

  const staff = STAFF.find((member) => member.id === staffId) ?? STAFF[0];
  const activeCategory = CATEGORIES.find((entry) => entry.id === category) ?? CATEGORIES[0];
  const items = MENU.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex h-dvh flex-col">
      <PosHeader subtitle="REGISTER · BAR">
        <HeaderMeta label="OUTLET">{OUTLET}</HeaderMeta>
        <HeaderMeta label="TIME">
          <Clock />
        </HeaderMeta>
        <HeaderMeta label="ON BAR">
          <StaffBadge initials={staff.initials} name={staff.name} />
        </HeaderMeta>
        <Link
          href="/sign-in"
          className="rounded-full border border-line bg-white px-6 py-2 text-sm font-medium transition-colors hover:border-muted"
        >
          Lock
        </Link>
      </PosHeader>

      <main className="grid min-h-0 flex-1 grid-cols-[1fr_400px]">
        <section className="flex min-h-0 flex-col">
          <div className="flex items-center gap-6 border-b border-line px-6 py-3">
            <nav className="flex items-center gap-5">
              {CATEGORIES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setCategory(entry.id)}
                  className={`flex items-baseline gap-1 text-sm transition-colors ${
                    entry.id === category
                      ? "rounded-full bg-ink px-4 py-1.5 font-medium text-cream"
                      : "text-ink/80 hover:text-ink"
                  }`}
                >
                  {entry.label}
                  <sup className="font-mono text-[10px] text-muted">
                    {categoryCount(entry.id)}
                  </sup>
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
                {activeCategory.heading}
              </h1>
              <p className="mono-label">{items.length} ITEMS</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItem(item.id)}
                  className="flex flex-col rounded-[10px] border border-line bg-white p-4 text-left transition-colors hover:border-muted"
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="font-mono text-[11px] text-muted">
                      {String(MENU.indexOf(item) + 1).padStart(2, "0")}
                    </span>
                    {item.badge && (
                      <span className="rounded-md border border-accent-bright px-1.5 py-0.5 font-mono text-[9px] text-accent-bright">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-2 font-serif text-xl">{item.name}</span>
                  <span className="mt-0.5 text-xs text-muted">{item.note}</span>
                  <span className="mt-5 font-mono text-[13px]">{rupiah(item.price)}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <OrderTicket />
      </main>
    </div>
  );
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
