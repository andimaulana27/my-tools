import Link from "next/link";
import { cn } from "@/lib/cn";

export function BrandMark({
  href = "/",
  kicker = "Workspace '26",
  className,
}: {
  href?: string;
  kicker?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("leading-none text-text", className)}>
      <span className="block text-sm font-black uppercase tracking-tight">
        Tools
        <span className="text-accent">.</span>
      </span>
      <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-text-faint">
        {kicker}
      </span>
    </Link>
  );
}
