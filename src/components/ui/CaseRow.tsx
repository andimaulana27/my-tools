import Link from "next/link";
import { cn } from "@/lib/cn";

export function CaseRow({
  index,
  title,
  kicker,
  summary,
  extra,
  href,
  className,
}: {
  index: string;
  title: string;
  kicker?: string;
  summary?: string;
  extra?: string | null;
  href?: string | null;
  className?: string;
}) {
  const n = String(parseInt(index.replace(/\D/g, ""), 10) || 1).padStart(2, "0");

  const inner = (
    <div
      className={cn(
        "relative grid gap-3 py-8 md:grid-cols-[3.5rem_1fr_auto] md:items-start md:gap-8",
        href && "group",
        className
      )}
    >
      <p className="font-mono text-[11px] tabular-nums text-text-faint transition-colors duration-hover group-hover:text-accent">
        {n}
      </p>
      <div className="min-w-0">
        <h3 className="text-xl font-black uppercase tracking-tight text-text transition-colors duration-hover group-hover:text-accent md:text-2xl">
          {title}
          <span className="text-accent">.</span>
        </h3>
        {kicker ? (
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-text-faint">{kicker}</p>
        ) : null}
        {summary ? (
          <p className="mt-3 max-w-xl text-sm leading-[1.7] text-text-muted">{summary}</p>
        ) : null}
      </div>
      <div className="flex flex-col items-start gap-3 md:items-end">
        {extra ? (
          <p className="text-[10px] uppercase tracking-[0.16em] text-text-faint">{extra}</p>
        ) : null}
        {href ? (
          <p className="hidden text-[11px] uppercase tracking-[0.18em] text-text-faint transition-colors duration-hover group-hover:text-accent md:block">
            Open
            <span
              aria-hidden
              className="ml-2 inline-block translate-x-0 transition-transform duration-hover group-hover:translate-x-1"
            >
              →
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block border-t border-line last:border-b">
        {inner}
      </Link>
    );
  }

  return <div className="border-t border-line last:border-b">{inner}</div>;
}
