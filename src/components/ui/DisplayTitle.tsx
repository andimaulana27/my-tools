import { cn } from "@/lib/cn";

export function DisplayTitle({
  children,
  as: Tag = "h1",
  className,
}: {
  children: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  const trimmed = children.trimEnd();
  const dotted = trimmed.endsWith(".");
  const body = dotted ? trimmed.slice(0, -1) : trimmed;

  return (
    <Tag className={cn("font-black uppercase leading-[0.86] tracking-tighter text-text", className)}>
      {body}
      {dotted ? <span className="text-accent">.</span> : null}
    </Tag>
  );
}
