"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/cn";

type NavItem = { name: string; href: string };

export function AppSidebar({
  markHref,
  kicker,
  items,
  footer,
  meta,
}: {
  markHref: string;
  kicker: string;
  items: NavItem[];
  footer: ReactNode;
  meta?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <BrandMark href={markHref} kicker={kicker} className="mb-8" />
      {meta ? <div className="mb-8 border-y border-line py-5">{meta}</div> : null}
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "px-1 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors duration-hover",
                active ? "text-accent" : "text-text-muted hover:text-accent"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 space-y-3">{footer}</div>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
        <span className="text-[11px] uppercase tracking-[0.18em]">{kicker}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] uppercase tracking-[0.16em] transition-colors duration-hover hover:text-accent"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? <div className="border-b border-line px-5 py-6 md:hidden">{nav}</div> : null}
      <aside className="fixed left-0 top-0 hidden h-screen w-56 flex-col border-r border-line bg-bg p-6 md:flex">
        {nav}
      </aside>
    </>
  );
}

export function SidebarAction({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "block w-full px-1 text-left text-[11px] uppercase tracking-[0.16em] text-text-faint transition-colors duration-hover hover:text-accent";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
