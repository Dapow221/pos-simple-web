"use client";

import { useState } from "react";
import { adjustStock, receiveGoods, type Product } from "@/lib/api";
import { rupiah } from "@/lib/money";

export const FIELD_CLASS =
  "mt-1.5 w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent-bright";

interface GoodsInLine {
  productId: string;
  quantity: string;
  unitCost: string;
}

const EMPTY_LINE: GoodsInLine = { productId: "", quantity: "", unitCost: "" };

export function GoodsInCard({ products, onSaved }: { products: Product[]; onSaved: () => void }) {
  const [lines, setLines] = useState<GoodsInLine[]>([EMPTY_LINE]);
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [savedText, setSavedText] = useState("");

  const setLine = (index: number, patch: Partial<GoodsInLine>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const items = lines
      .filter((line) => line.productId && Number(line.quantity) > 0)
      .map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        ...(line.unitCost !== "" ? { unitCost: Number(line.unitCost) } : {}),
      }));
    if (items.length === 0) {
      setErrorText("ADD AT LEAST ONE PRODUCT + QUANTITY");
      return;
    }
    setSaving(true);
    setErrorText("");
    setSavedText("");
    try {
      const levels = await receiveGoods({
        items,
        ...(supplier.trim() ? { supplier: supplier.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setSavedText(
        levels.map((level) => `${level.name} → ${level.stock}`).join(" · ").toUpperCase(),
      );
      setLines([EMPTY_LINE]);
      setSupplier("");
      setNote("");
      onSaved();
    } catch (error) {
      setErrorText((error as Error).message.toUpperCase());
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">Barang masuk</h2>
        <span className="mono-label">GOODS IN</span>
      </div>
      <form onSubmit={submit} className="mt-4">
        {lines.map((line, index) => (
          <div key={index} className="mt-2 grid grid-cols-[1fr_76px_110px] gap-2 first:mt-0">
            <ProductSelect
              products={products}
              value={line.productId}
              onChange={(productId) => setLine(index, { productId })}
            />
            <input
              inputMode="numeric"
              placeholder="Qty"
              value={line.quantity}
              onChange={(event) =>
                setLine(index, { quantity: event.target.value.replace(/\D/g, "") })
              }
              className={FIELD_CLASS.replace("mt-1.5 ", "")}
            />
            <input
              inputMode="numeric"
              placeholder="Cost/unit"
              value={line.unitCost}
              onChange={(event) =>
                setLine(index, { unitCost: event.target.value.replace(/\D/g, "") })
              }
              className={FIELD_CLASS.replace("mt-1.5 ", "")}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((current) => [...current, EMPTY_LINE])}
          className="mono-label mt-3 underline underline-offset-2 transition-colors hover:text-ink"
        >
          + ADD LINE
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mono-label block text-[9px]">SUPPLIER · OPTIONAL</span>
            <input
              maxLength={120}
              value={supplier}
              onChange={(event) => setSupplier(event.target.value)}
              className={FIELD_CLASS}
            />
          </label>
          <label className="block">
            <span className="mono-label block text-[9px]">NOTE · OPTIONAL</span>
            <input
              maxLength={300}
              placeholder="e.g. PO number"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={FIELD_CLASS}
            />
          </label>
        </div>

        {errorText && <p className="mono-label mt-3 text-accent-bright">{errorText}</p>}
        {savedText && <p className="mono-label mt-3 text-accent">RECEIVED — {savedText}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Receive stock"}
        </button>
      </form>
    </section>
  );
}

export function AdjustmentCard({
  products,
  onSaved,
}: {
  products: Product[];
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [direction, setDirection] = useState<"out" | "in">("out");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [savedText, setSavedText] = useState("");

  const product = products.find((entry) => entry.id === productId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const qty = Number(quantity);
    if (!productId || !Number.isInteger(qty) || qty <= 0) {
      setErrorText("PICK A PRODUCT AND A QUANTITY");
      return;
    }
    setSaving(true);
    setErrorText("");
    setSavedText("");
    try {
      const level = await adjustStock({
        productId,
        quantity: direction === "out" ? -qty : qty,
        reason: reason.trim(),
      });
      setSavedText(`${level.name} → ${level.stock}`.toUpperCase());
      setQuantity("");
      setReason("");
      onSaved();
    } catch (error) {
      setErrorText((error as Error).message.toUpperCase());
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">Penyesuaian</h2>
        <span className="mono-label">WASTE · BREAKAGE · FOUND</span>
      </div>
      <form onSubmit={submit} className="mt-4">
        <label className="block">
          <span className="mono-label block text-[9px]">PRODUCT</span>
          <ProductSelect products={products} value={productId} onChange={setProductId} withMargin />
        </label>
        {product && (
          <p className="mt-1.5 text-xs text-muted">
            Current stock {product.stock} · {rupiah(product.price)}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mono-label block text-[9px]">DIRECTION</span>
            <select
              value={direction}
              onChange={(event) => setDirection(event.target.value as "out" | "in")}
              className={FIELD_CLASS}
            >
              <option value="out">Stock out · − minus</option>
              <option value="in">Stock in · + plus</option>
            </select>
          </label>
          <label className="block">
            <span className="mono-label block text-[9px]">QUANTITY</span>
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ""))}
              className={FIELD_CLASS}
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mono-label block text-[9px]">REASON · REQUIRED</span>
          <input
            required
            maxLength={300}
            placeholder="e.g. Botol pecah"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        {errorText && <p className="mono-label mt-3 text-accent-bright">{errorText}</p>}
        {savedText && <p className="mono-label mt-3 text-accent">ADJUSTED — {savedText}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Apply adjustment"}
        </button>
      </form>
    </section>
  );
}

function ProductSelect({
  products,
  value,
  onChange,
  withMargin,
}: {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  withMargin?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={withMargin ? FIELD_CLASS : FIELD_CLASS.replace("mt-1.5 ", "")}
    >
      <option value="">Pick a product…</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} · {product.sku}
        </option>
      ))}
    </select>
  );
}
