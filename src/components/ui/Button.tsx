import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "text";

const styles: Record<Variant, string> = {
  primary:
    "inline-flex h-11 items-center justify-center bg-btn-bg px-6 text-sm font-medium text-btn-fg shadow-none transition-opacity duration-hover hover:opacity-80 disabled:opacity-50",
  ghost:
    "inline-flex h-11 items-center justify-center border border-line bg-transparent px-6 text-sm font-medium text-text transition-colors duration-hover hover:border-text hover:bg-text hover:text-bg disabled:opacity-50",
  text: "inline-flex items-center text-sm text-text underline underline-offset-4 transition-colors duration-hover hover:text-accent disabled:opacity-50",
};

type Common = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

type ButtonAsLink = Common & {
  href: string;
  target?: string;
  rel?: string;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", className, children } = props;
  const cls = cn(styles[variant], className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls} target={props.target} rel={props.rel}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button
      type={buttonProps.type ?? "button"}
      className={cls}
      disabled={buttonProps.disabled}
      onClick={buttonProps.onClick}
    >
      {children}
    </button>
  );
}
