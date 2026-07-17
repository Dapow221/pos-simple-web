"use client";

import { useEffect, useState } from "react";
import { createExpense, deleteExpense, getExpenses, type Expense } from "@/lib/api";
import { cn } from "@/lib/cn";
import { rupiah } from "@/lib/money";

const CATEGORIES = [
  "Bahan baku",
  "Gaji",
  "Sewa",
  "Listrik & air",
  "Peralatan",
  "Marketing",
  "Lainnya",
] as const;

const FIELD_CLASS =
  "mt-1.5 w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent-bright";

function todayInStoreTime(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function NewExpenseCard({ onSaved }: { onSaved: () => void }) {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [spentOn, setSpentOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [savedText, setSavedText] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setErrorText("AMOUNT MUST BE A POSITIVE RUPIAH NUMBER");
      return;
    }
    setSaving(true);
    setErrorText("");
    setSavedText("");
    try {
      const expense = await createExpense({
        category,
        description: description.trim(),
        amount: value,
        spentOn: spentOn || todayInStoreTime(),
      });
      setSavedText(`${expense.category} · ${rupiah(expense.amount)} RECORDED`.toUpperCase());
      setDescription("");
      setAmount("");
      setSpentOn("");
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
        <h2 className="font-serif text-xl font-semibold">New expense</h2>
        <span className="mono-label">PENGELUARAN</span>
      </div>
      <form onSubmit={submit} className="mt-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mono-label block text-[9px]">CATEGORY</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={FIELD_CLASS}
            >
              {CATEGORIES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mono-label block text-[9px]">DATE · DEFAULT TODAY</span>
            <input
              type="date"
              value={spentOn}
              max={todayInStoreTime()}
              onChange={(event) => setSpentOn(event.target.value)}
              className={FIELD_CLASS}
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mono-label block text-[9px]">DESCRIPTION</span>
          <input
            required
            maxLength={300}
            placeholder="e.g. Susu UHT 24 liter"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <label className="mt-3 block">
          <span className="mono-label block text-[9px]">AMOUNT · RUPIAH</span>
          <input
            required
            inputMode="numeric"
            placeholder="e.g. 312000"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
            className={cn(FIELD_CLASS, "font-mono")}
          />
        </label>

        {errorText && <p className="mono-label mt-3 text-accent-bright">{errorText}</p>}
        {savedText && <p className="mono-label mt-3 text-accent">{savedText}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
        >
          {saving ? "Recording…" : "Record expense"}
        </button>
      </form>
    </section>
  );
}

const PAGE_SIZE = 10;

interface ExpensesCardProps {
  /** Bumped by the parent when an expense is added elsewhere. */
  refreshKey: number;
  onChanged: () => void;
}

export function ExpensesCard({ refreshKey, onChanged }: ExpensesCardProps) {
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("");
  const requestKey = JSON.stringify({ page, category, refreshKey });
  const [result, setResult] = useState<{
    key: string;
    rows: Expense[];
    total: number;
    amountTotal: number;
  } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    let cancelled = false;
    getExpenses(PAGE_SIZE, page * PAGE_SIZE, category ? { category } : {})
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

  const remove = async (expense: Expense) => {
    setDeletingId(expense.id);
    try {
      await deleteExpense(expense.id);
      onChanged();
    } finally {
      setDeletingId("");
    }
  };

  const error = failure?.key === requestKey ? failure.message : "";
  const loading = result?.key !== requestKey && !error;
  const total = result?.total ?? 0;
  const lastPage = Math.max(Math.ceil(total / PAGE_SIZE) - 1, 0);

  return (
    <section className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">Expense log</h2>
        <span className="mono-label">
          {result ? `${total} ENTRIES · ${rupiah(result.amountTotal)}` : "LOADING…"}
        </span>
      </div>

      <div className="mt-4">
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(0);
          }}
          className="rounded-[10px] border border-line bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent-bright"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mono-label mt-4 text-accent-bright">{error.toUpperCase()}</p>}
      {!result && !error && (
        <div className="mt-4 h-56 animate-pulse rounded-[10px] border border-line" aria-hidden />
      )}

      {result && (
        <div className={cn("mt-4 transition-opacity", loading && "pointer-events-none opacity-60")}>
          {result.rows.length === 0 ? (
            <p className="text-sm text-muted">No expenses here yet — record the first one.</p>
          ) : (
            <div className="overflow-x-auto rounded-[10px] border border-line">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    {["DATE", "CATEGORY", "DESCRIPTION", "BY", "AMOUNT", ""].map((label, i) => (
                      <th key={i} className="mono-label px-4 py-3 font-normal">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.rows.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-3 font-mono text-xs">{expense.spentOn}</td>
                      <td className="px-4 py-3">
                        <span className="mono-label rounded-md border border-line px-1.5 py-0.5 text-[9px]">
                          {expense.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3">{expense.description}</td>
                      <td className="px-4 py-3 text-xs text-muted">{expense.createdBy ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {rupiah(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={deletingId === expense.id}
                          onClick={() => remove(expense)}
                          className="mono-label text-[9px] underline underline-offset-2 transition-colors hover:text-accent-bright disabled:opacity-40"
                        >
                          {deletingId === expense.id ? "…" : "DELETE"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="mono-label">
              {total === 0
                ? "NO ENTRIES"
                : `SHOWING ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} OF ${total}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                className="rounded-full border border-line bg-white px-4 py-1.5 font-mono text-xs transition-colors hover:border-muted disabled:pointer-events-none disabled:opacity-40"
              >
                ‹ Prev
              </button>
              <span className="mono-label">
                PAGE {Math.min(page, lastPage) + 1} / {lastPage + 1}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(p + 1, lastPage))}
                className="rounded-full border border-line bg-white px-4 py-1.5 font-mono text-xs transition-colors hover:border-muted disabled:pointer-events-none disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
