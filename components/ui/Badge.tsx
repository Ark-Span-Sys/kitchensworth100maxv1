import type { HTMLAttributes } from "react";

type Tone = "default" | "green" | "yellow" | "red" | "outline";

const TONES: Record<Tone, string> = {
  default: "bg-brand-black/5 text-brand-black/70",
  green: "bg-brand-green/20 text-brand-green-dark",
  yellow: "bg-brand-yellow/30 text-brand-black",
  red: "bg-red-100 text-red-700",
  outline: "border border-brand-black/15 text-brand-black/70",
};

export function Badge({
  tone = "default",
  className = "",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${TONES[tone]} ${className}`}
      {...rest}
    />
  );
}
