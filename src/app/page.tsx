import Link from "next/link";

const CONTENTS = [
  {
    number: "02",
    title: "Register",
    description:
      "Menu catalog by category, live order ticket, qty steppers, dine-in / takeaway, 11% tax.",
    href: "/register",
  },
  {
    number: "03",
    title: "Payment & receipt",
    description:
      "Cash, QRIS, card or e-wallet. Cash keypad with change, then a printable receipt.",
    href: "/payment",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-10 py-12">
      <header className="flex items-start justify-between border-b border-line pb-6">
        <div className="flex items-center gap-5">
          <span className="flex size-14 items-center justify-center rounded-xl bg-ink font-serif text-3xl text-cream">
            R
          </span>
          <div>
            <h1 className="font-serif text-[44px] leading-none">Ratio Coffee</h1>
            <p className="mono-label mt-2">POINT OF SALE · STAFF TERMINAL</p>
          </div>
        </div>
        <div className="mono-label space-y-1.5 text-right leading-none">
          <p>
            Edition No. <span className="text-ink">014</span>
          </p>
          <p>Senopati · Jakarta</p>
          <p>
            Currency · <span className="text-ink">IDR</span>
          </p>
        </div>
      </header>

      <section className="flex items-start justify-between gap-10 py-12">
        <p className="max-w-[620px] font-serif text-[34px] leading-[1.35] tracking-tight">
          A register that reads like a{" "}
          <Link href="/register" className="text-accent underline decoration-1 underline-offset-4">
            menu card
          </Link>{" "}
          — ink on paper, one blue rule, and everything the bar needs in two
          taps.
        </p>
        <p className="text-right font-serif text-[40px] leading-snug">
          珈琲
          <br />
          <span className="text-accent">店</span>
        </p>
      </section>

      <div className="flex items-center gap-4 pb-5">
        <span className="mono-label shrink-0">目次 / Contents</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Link
        href="/sign-in"
        className="group flex gap-10 rounded-[14px] bg-ink px-10 py-7 text-cream"
      >
        <span className="font-serif text-[34px] leading-none text-accent-bright">
          01
        </span>
        <span>
          <span className="block font-serif text-2xl">Sign in &amp; open register</span>
          <span className="mt-1 block text-sm text-cream/60">
            Staff picker with a 4-digit PIN pad. Unlocks the till for the shift on the bar.
          </span>
          <span className="mono-label mt-4 block text-cream/80 group-hover:text-cream">
            START HERE ↗
          </span>
        </span>
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {CONTENTS.map((entry) => (
          <Link
            key={entry.number}
            href={entry.href}
            className="group flex gap-8 rounded-[14px] border border-line bg-white px-8 py-7 transition-colors hover:border-muted"
          >
            <span className="font-serif text-[34px] leading-none text-accent">
              {entry.number}
            </span>
            <span className="flex flex-col">
              <span className="font-serif text-2xl">{entry.title}</span>
              <span className="mt-1 text-sm text-muted">{entry.description}</span>
              <span className="mono-label mt-5 text-ink/70 group-hover:text-ink">
                OPEN ↗
              </span>
            </span>
          </Link>
        ))}
      </div>

      <footer className="mono-label mt-12 flex items-center justify-between border-t border-line pt-5">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-green-600" />
          RESPONSIVE · PHONE · TABLET · DESKTOP
        </span>
        <span>RATIO POS V1.4 — MAGAZINE EDITION</span>
      </footer>
    </main>
  );
}
