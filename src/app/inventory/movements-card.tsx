"use client";

import { useEffect, useState } from "react";
import {
  getMovements,
  type MovementType,
  type Product,
  type StockMovement,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { rupiah } from "@/lib/money";

const PAGE_SIZE = 10;

const TYPE_LABELS: Record<string, string> = {
  sale: "Sale",
  goods_in: "Goods in",
  adjustment: "Adjustment",
  opname: "Opname",
};

interface MovementsCardProps {
  products: Product[];
  /** Bumped by the parent after any stock mutation, so the ledger refetches. */
  refreshKey: number;
}

export function MovementsCard({ products, refreshKey }: MovementsCardProps) {
  const [page, setPage] = useState(0);
  const [type, setType] = useState<MovementType | "">("");
  const [productId, setProductId] = useState("");
  const requestKey = JSON.stringify({ page, type, productId, refreshKey });
  const [result, setResult] = useState<{
    key: string;
    rows: StockMovement[];
    total: number;
  } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMovements(PAGE_SIZE, page * PAGE_SIZE, {
      ...(type ? { type } : {}),
      ...(productId ? { productId } : {}),
    })
      .then((data) => {
        if (!cancelled) setResult({ ...data, key: requestKey });
      })
      .catch((cause: Error) => {
        if (!cancelled) setFailure({ key: requestKey, message: cause.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const error = failure?.key === requestKey ? failure.message : "";
  const loading = result?.key !== requestKey && !error;
  const total = result?.total ?? 0;
  const lastPage = Math.max(Math.ceil(total / PAGE_SIZE) - 1, 0);

  const filterField =
    "rounded-[10px] border border-line bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent-bright";

  return (
    <section className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">Kartu stok</h2>
        <span className="mono-label">{result ? `${total} MOVEMENTS` : "LOADING…"}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mono-label block text-[9px]">TYPE</span>
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as MovementType | "");
              setPage(0);
            }}
            className={cn(filterField, "mt-1.5")}
          >
            <option value="">All types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mono-label block text-[9px]">PRODUCT</span>
          <select
            value={productId}
            onChange={(event) => {
              setProductId(event.target.value);
              setPage(0);
            }}
            className={cn(filterField, "mt-1.5")}
          >
            <option value="">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mono-label mt-4 text-accent-bright">{error.toUpperCase()}</p>}
      {!result && !error && (
        <div className="mt-4 h-56 animate-pulse rounded-[10px] border border-line" aria-hidden />
      )}

      {result && (
        <div className={cn("mt-4 transition-opacity", loading && "pointer-events-none opacity-60")}>
          {result.rows.length === 0 ? (
            <p className="text-sm text-muted">No movements match — stock hasn&apos;t moved yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-[10px] border border-line">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    {["TIME · WIB", "PRODUCT", "TYPE", "QTY", "COST", "NOTE / REF", "BY"].map(
                      (label) => (
                        <th key={label} className="mono-label px-4 py-3 font-normal">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.rows.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatWibTime(movement.createdAt)}
                      </td>
                      <td className="px-4 py-3">{movement.name}</td>
                      <td className="px-4 py-3">
                        <span className="mono-label rounded-md border border-line px-1.5 py-0.5 text-[9px]">
                          {(TYPE_LABELS[movement.type] ?? movement.type).toUpperCase()}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 font-mono tabular-nums",
                          movement.quantity < 0 ? "text-accent-bright" : "text-accent",
                        )}
                      >
                        {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums">
                        {movement.unitCost !== null ? rupiah(movement.unitCost) : "—"}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-xs text-muted">
                        {[movement.supplier, movement.note, movement.ref]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">{movement.createdBy ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="mono-label">
              {total === 0
                ? "NO MOVEMENTS"
                : `SHOWING ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} OF ${total}`}
            </span>
            <div className="flex items-center gap-2">
              <PagerButton disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))}>
                ‹ Prev
              </PagerButton>
              <span className="mono-label">
                PAGE {Math.min(page, lastPage) + 1} / {lastPage + 1}
              </span>
              <PagerButton
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(p + 1, lastPage))}
              >
                Next ›
              </PagerButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-line bg-white px-4 py-1.5 font-mono text-xs transition-colors hover:border-muted disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function formatWibTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
