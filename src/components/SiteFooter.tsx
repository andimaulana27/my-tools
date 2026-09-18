import { SITE_WRAP } from "@/lib/layout";
import { cn } from "@/lib/cn";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className={cn(SITE_WRAP, "flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between")}>
        <div>
          <p className="text-sm font-black uppercase tracking-tight text-text">
            Tools
            <span className="text-accent">.</span>
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-text-faint">
            Private workspace
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint">
          Personal instance · not public
        </p>
      </div>
    </footer>
  );
}
