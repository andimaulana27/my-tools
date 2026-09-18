import { cn } from "@/lib/cn";

export function Stamp({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-7 bg-accent" aria-hidden />
      <p className="text-[10px] uppercase tracking-[0.22em] text-accent">{children}</p>
    </div>
  );
}
