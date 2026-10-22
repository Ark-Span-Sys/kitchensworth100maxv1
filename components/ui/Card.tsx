import type { HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-brand-black/8 bg-white shadow-sm ${className}`}
      {...rest}
    />
  );
}
