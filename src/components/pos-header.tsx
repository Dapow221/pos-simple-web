import Link from "next/link";

interface PosHeaderProps {
  subtitle: string;
  children?: React.ReactNode;
}

export function PosHeader({ subtitle, children }: PosHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-cream px-6 py-3">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-ink font-serif text-lg text-cream">
          R
        </span>
        <span>
          <span className="block font-serif text-lg font-semibold leading-tight">
            Ratio Coffee
          </span>
          <span className="mono-label block text-[9px]">{subtitle}</span>
        </span>
      </Link>
      <div className="flex items-center gap-8">{children}</div>
    </header>
  );
}

interface HeaderMetaProps {
  label: string;
  children: React.ReactNode;
}

export function HeaderMeta({ label, children }: HeaderMetaProps) {
  return (
    <div>
      <span className="mono-label block text-[9px]">{label}</span>
      <span className="block text-sm font-medium">{children}</span>
    </div>
  );
}

interface StaffBadgeProps {
  initials: string;
  name: string;
}

export function StaffBadge({ initials, name }: StaffBadgeProps) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-cream">
        {initials}
      </span>
      <span className="text-sm font-medium">{name}</span>
    </span>
  );
}
