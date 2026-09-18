import type { ReactNode } from "react";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Stamp } from "@/components/ui/Stamp";

export function PageHeading({
  stamp,
  title,
  lede,
  meta,
}: {
  stamp: string;
  title: string;
  lede?: string;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <Stamp className="mb-4">{stamp}</Stamp>
        <DisplayTitle as="h1" className="text-4xl md:text-5xl">
          {title}
        </DisplayTitle>
        {lede ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">{lede}</p>
        ) : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </header>
  );
}

export function QuotaMeta({ value }: { value: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-text-faint">Quota</p>
      <p className="mt-1.5 font-mono text-2xl font-black tabular-nums text-text">{value}</p>
    </div>
  );
}
