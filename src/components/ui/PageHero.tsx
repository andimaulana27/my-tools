import type { ReactNode } from "react";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { MetaRow, type MetaItem } from "@/components/ui/MetaRow";
import { Stamp } from "@/components/ui/Stamp";

export function PageHero({
  stamp,
  title,
  meta,
  lede,
  actions,
  as = "h1",
  className,
}: {
  stamp: string;
  title: string;
  meta?: MetaItem[];
  lede?: string;
  actions?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <header className={className}>
      <Stamp className="mb-6">{stamp}</Stamp>
      <DisplayTitle as={as} className="text-6xl md:text-8xl">
        {title}
      </DisplayTitle>
      {meta?.length ? (
        <div className="mt-10 max-w-3xl">
          <MetaRow items={meta} />
        </div>
      ) : null}
      {lede ? (
        <p className="mt-8 max-w-xl text-sm leading-[1.75] text-text-muted">{lede}</p>
      ) : null}
      {actions ? <div className="mt-10 flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
