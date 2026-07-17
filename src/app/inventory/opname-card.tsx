"use client";

import { useState } from "react";
import { applyOpname, type OpnameVariance, type Product } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * Stock opname: type the physically counted quantity next to each product.
 * Blank = not counted (left untouched). Submitting shows the variance report.
 */
export function OpnameCard({
  products,
  onApplied,
}: {
  products: Product[];
  onApplied: () => void;
}) {
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [variances, setVariances] = useState<OpnameVariance[] | null>(null);

  const countedEntries = Object.entries(counts).filter(([, value]) => value !== "");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (countedEntries.length === 0) {
      setErrorText("COUNT AT LEAST ONE PRODUCT FIRST");
      return;
    }
    setSaving(true);
    setErrorText("");
    try {
      const report = await applyOpname({
        counts: countedEntries.map(([productId, value]) => ({
          productId,
          counted: Number(value),
        })),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setVariances(report);
      setCounts({});
      setNote("");
      onApplied();
    } catch (error) {
      setErrorText((error as Error).message.toUpperCase());
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">Stock opname</h2>
        <span className="mono-label">
          {countedEntries.length > 0 ? `${countedEntries.length} COUNTED` : "PHYSICAL COUNT"}
        </span>
      </div>

      <form onSubmit={submit} className="mt-4">
        <div className="max-h-[380px] overflow-auto rounded-[10px] border border-line">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="sticky top-0 bg-cream">
              <tr className="border-b border-line text-left">
                {["PRODUCT", "SKU", "SYSTEM", "COUNTED"].map((label) => (
                  <th key={label} className="mono-label px-4 py-3 font-normal">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-2.5">{product.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{product.sku}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">{product.stock}</td>
                  <td className="px-4 py-2">
                    <input
                      inputMode="numeric"
                      placeholder="—"
                      value={counts[product.id] ?? ""}
                      onChange={(event) =>
                        setCounts((current) => ({
                          ...current,
                          [product.id]: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className={cn(
                        "w-24 rounded-[8px] border border-line bg-white px-3 py-1.5 font-mono text-sm outline-none transition-colors focus:border-accent-bright",
                        counts[product.id] &&
                          Number(counts[product.id]) !== product.stock &&
                          "border-accent-bright text-accent",
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="mono-label block text-[9px]">NOTE · OPTIONAL</span>
            <input
              maxLength={300}
              placeholder="e.g. Opname malam shift 2"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent-bright"
            />
          </label>
          <button
            type="submit"
            disabled={saving || countedEntries.length === 0}
            className="rounded-[10px] bg-ink px-6 py-3 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
          >
            {saving ? "Reconciling…" : `Reconcile ${countedEntries.length || ""} counts`}
          </button>
        </div>

        {errorText && <p className="mono-label mt-3 text-accent-bright">{errorText}</p>}
      </form>

      {variances && <VarianceReport variances={variances} onClose={() => setVariances(null)} />}
    </section>
  );
}

function VarianceReport({
  variances,
  onClose,
}: {
  variances: OpnameVariance[];
  onClose: () => void;
}) {
  const adjusted = variances.filter((v) => v.difference !== 0);
  return (
    <div className="mt-4 rounded-[10px] border border-accent-bright bg-tint p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="mono-label text-accent">
          OPNAME APPLIED — {adjusted.length} OF {variances.length} PRODUCTS ADJUSTED
        </p>
        <button type="button" onClick={onClose} className="mono-label hover:text-ink">
          DISMISS ×
        </button>
      </div>
      {adjusted.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {adjusted.map((v) => (
            <li key={v.productId} className="flex justify-between gap-3">
              <span>{v.name}</span>
              <span className="font-mono tabular-nums">
                {v.systemStock} → {v.counted} ({v.difference > 0 ? "+" : ""}
                {v.difference})
              </span>
            </li>
          ))}
        </ul>
      )}
      {adjusted.length === 0 && (
        <p className="mt-1 text-sm text-muted">Everything matched — no corrections needed.</p>
      )}
    </div>
  );
}
