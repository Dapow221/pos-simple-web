import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface PosHeaderProps {
  subtitle: string;
  children?: React.ReactNode;
}

export function PosHeader({ subtitle, children }: PosHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-cream px-4 py-3 sm:px-6">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Ratio Coffee cat logo"
          width={29}
          height={36}
          className="h-9 w-auto"
        />
        <span>
          <span className="block font-serif text-lg font-semibold leading-tight">
            Ratio Coffee
          </span>
          <span className="mono-label block text-[9px]">{subtitle}</span>
        </span>
      </Link>
      <div className="flex items-center gap-4 sm:gap-8">{children}</div>
    </header>
  );
}

interface HeaderMetaProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function HeaderMeta({ label, children, className }: HeaderMetaProps) {
  return (
    <div className={cn(className)}>
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
