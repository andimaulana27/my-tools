"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { SITE_WRAP } from "@/lib/layout";

const NAV = [
  { name: "Home", href: "/" },
  { name: "Engines", href: "/#engines" },
  { name: "Login", href: "/login" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <nav className={cn(SITE_WRAP, "flex h-[4.25rem] items-center justify-between")}>
        <BrandMark />
        <ul className="hidden items-center gap-5 md:flex lg:gap-7">
          {NAV.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className={cn(
                  "text-[11px] uppercase tracking-[0.2em] transition-colors duration-hover",
                  pathname === link.href ? "text-accent" : "text-text-muted hover:text-accent"
                )}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <ThemeToggle className="text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors duration-hover hover:text-accent" />
          <Button href="/login" variant="ghost" className="hidden h-9 px-5 text-[11px] uppercase tracking-[0.18em] sm:inline-flex">
            Enter
          </Button>
          <button
            type="button"
            className="text-[11px] uppercase tracking-[0.18em] text-text transition-colors duration-hover hover:text-accent md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>
      {open ? (
        <div className={cn(SITE_WRAP, "border-t border-line py-5 md:hidden")}>
          <ul className="flex flex-col gap-3">
            {NAV.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-[11px] uppercase tracking-[0.2em] text-text transition-colors duration-hover hover:text-accent"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
