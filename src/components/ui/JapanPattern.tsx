"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type Motif = "asanoha" | "seigaiha";

export function JapanPattern({
  motif,
  className,
}: {
  motif: Motif;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const pid = `${motif}-${uid}`;

  return (
    <svg
      aria-hidden
      className={cn("h-full w-full text-accent", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {motif === "seigaiha" ? (
          <pattern id={pid} width="48" height="24" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="0.9">
              <path d="M0 24a24 24 0 0 1 48 0" />
              <path d="M0 24a16 16 0 0 1 48 0" />
              <path d="M0 24a8 8 0 0 1 48 0" />
              <path d="M-24 24a24 24 0 0 1 48 0" />
              <path d="M-24 24a16 16 0 0 1 48 0" />
              <path d="M24 24a24 24 0 0 1 48 0" />
              <path d="M24 24a16 16 0 0 1 48 0" />
            </g>
          </pattern>
        ) : (
          <pattern id={pid} width="56" height="97" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="0.85">
              <path d="M28 0 L52 14 V42 L28 56 L4 42 V14 Z" />
              <path d="M28 0 V56 M4 14 L52 42 M52 14 L4 42" />
              <path d="M28 14 L40 21 V35 L28 42 L16 35 V21 Z" />
              <path d="M28 48.5 L52 62.5 V90.5 L28 104.5 L4 90.5 V62.5 Z" />
              <path d="M28 48.5 V104.5 M4 62.5 L52 90.5 M52 62.5 L4 90.5" />
            </g>
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}

export function PatternPanel({
  motif,
  className,
}: {
  motif: Motif;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 right-0 hidden w-[min(52rem,68%)] text-accent opacity-[0.22] [mask-image:linear-gradient(to_left,black_68%,transparent)] [-webkit-mask-image:linear-gradient(to_left,black_68%,transparent)] lg:block",
        className
      )}
    >
      <JapanPattern motif={motif} className="h-full w-full" />
    </div>
  );
}

export function LoginOrnament({ className }: { className?: string }) {
  return (
    <aside
      aria-hidden
      className={cn(
        "relative hidden min-h-[28rem] items-center justify-center pb-8 lg:flex",
        className
      )}
    >
      <div className="absolute right-2 top-16 flex flex-col items-center gap-5">
        <p className="text-[11px] font-medium tracking-[0.5em] text-text-faint [writing-mode:vertical-rl] [text-orientation:upright]">
          入場
        </p>
        <span className="h-8 w-px bg-accent" aria-hidden />
        <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-text-faint [writing-mode:vertical-rl]">
          Access
        </p>
      </div>
      <div className="flex flex-col items-center gap-8">
        <p className="text-stroke select-none text-[clamp(7rem,14vw,11rem)] font-black leading-[0.78] tracking-tighter">
          場
        </p>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-accent text-[11px] font-black tracking-[0.28em] text-accent">
            印
          </span>
          <p className="text-[10px] uppercase tracking-[0.28em] text-text-faint">
            01 / tools
          </p>
        </div>
      </div>
    </aside>
  );
}
