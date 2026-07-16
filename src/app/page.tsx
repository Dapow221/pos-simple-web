import Link from "next/link";

export const unstable_instant = { prefetch: "static" };

const FLOW_STEPS = [
  { number: "01", title: "Sign in", detail: "Pick a staff card, tap a 4-digit PIN." },
  { number: "02", title: "Ring the order", detail: "Tap menu items onto the ticket." },
  { number: "03", title: "Take payment", detail: "Cash, QRIS or card — change is counted." },
  { number: "04", title: "Watch the dashboard", detail: "The sale lands in the reports live." },
];

const CONTENTS = [
  {
    number: "02",
    title: "Register",
    description:
      "Menu catalog by category, live order ticket, qty steppers, dine-in / takeaway, 11% tax.",
    href: "/register",
    badge: null,
  },
  {
    number: "03",
    title: "Payment & receipt",
    description:
      "Cash, QRIS, card or e-wallet. Cash keypad with change, then a printable receipt.",
    href: "/payment",
    badge: null,
  },
  {
    number: "04",
    title: "Dashboard",
    description:
      "Revenue by day, best sellers, payment mix, restock alerts — live from the API.",
    href: "/dashboard",
    badge: "MANAGER · PIN 2026",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-5 py-8 sm:px-10 sm:py-12">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="flex size-12 items-center justify-center rounded-xl bg-ink font-serif text-2xl text-cream sm:size-14 sm:text-3xl">
            R
          </span>
          <div>
            <h1 className="font-serif text-[32px] leading-none sm:text-[44px]">Ratio Coffee</h1>
            <p className="mono-label mt-2">POINT OF SALE · DEMO TERMINAL</p>
          </div>
        </div>
        <div className="mono-label space-y-1.5 leading-none sm:text-right">
          <p>
            Edition No. <span className="text-ink">014</span>
          </p>
          <p>Senopati · Jakarta</p>
          <p>
            Currency · <span className="text-ink">IDR</span>
          </p>
        </div>
      </header>

      <section className="flex flex-col items-start justify-between gap-8 py-10 sm:py-12 lg:flex-row lg:gap-10">
        <div className="max-w-[620px]">
          <p className="font-serif text-[26px] leading-[1.35] tracking-tight sm:text-[34px]">
            This is a <span className="text-accent">point-of-sale demo</span> for a
            coffee bar — the till the barista taps, and the dashboard the manager
            reads.
          </p>
          <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-muted sm:text-[15px]">
            Everything runs against a live API: sign in with a PIN, ring up an
            order, take payment, and the sale shows up in the reports seconds
            later. No setup needed — demo accounts are ready below.
          </p>
        </div>
        <p className="hidden text-right font-serif text-[40px] leading-snug lg:block">
          珈琲
          <br />
          <span className="text-accent">店</span>
        </p>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line lg:grid-cols-4">
        {FLOW_STEPS.map((step) => (
          <div key={step.number} className="bg-white px-5 py-4">
            <p className="mono-label">
              STEP <span className="text-accent">{step.number}</span>
            </p>
            <p className="mt-1.5 font-serif text-lg leading-tight">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 pb-5">
        <span className="mono-label shrink-0">目次 / Contents</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Link
        href="/sign-in"
        className="group flex gap-6 rounded-[14px] bg-ink px-6 py-6 text-cream sm:gap-10 sm:px-10 sm:py-7"
      >
        <span className="font-serif text-[28px] leading-none text-accent-bright sm:text-[34px]">
          01
        </span>
        <span>
          <span className="block font-serif text-xl sm:text-2xl">
            Sign in &amp; open register
          </span>
          <span className="mt-1 block text-sm text-cream/60">
            Staff picker with a 4-digit PIN pad. Demo PINs — Anya 1234 · Bima
            2580 · Rama 0000 · Admin 2026 (manager).
          </span>
          <span className="mono-label mt-4 block text-cream/80 group-hover:text-cream">
            START HERE ↗
          </span>
        </span>
      </Link>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENTS.map((entry) => (
          <Link
            key={entry.number}
            href={entry.href}
            className="group flex gap-6 rounded-[14px] border border-line bg-white px-6 py-6 transition-colors hover:border-muted sm:px-8 sm:py-7"
          >
            <span className="font-serif text-[28px] leading-none text-accent sm:text-[34px]">
              {entry.number}
            </span>
            <span className="flex flex-col">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl">{entry.title}</span>
                {entry.badge && (
                  <span className="rounded-md border border-accent-bright px-1.5 py-0.5 font-mono text-[9px] text-accent-bright">
                    {entry.badge}
                  </span>
                )}
              </span>
              <span className="mt-1 text-sm text-muted">{entry.description}</span>
              <span className="mono-label mt-5 text-ink/70 group-hover:text-ink">
                OPEN ↗
              </span>
            </span>
          </Link>
        ))}
      </div>

      <footer className="mono-label mt-10 flex flex-col gap-3 border-t border-line pt-5 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-green-600" />
          RESPONSIVE · PHONE · TABLET · DESKTOP
        </span>
        <span>RATIO POS V1.5 — MAGAZINE EDITION</span>
      </footer>
    </main>
  );
}
