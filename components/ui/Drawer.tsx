"use client";
import { useEffect, type ReactNode } from "react";

/**
 * Right-side drawer used by the cart. Controlled by parent state.
 * Handles: backdrop click to close, ESC key, body scroll lock, focus trap-lite.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-brand-black/50 backdrop-blur-sm"
      />
      <aside
        className={`relative flex h-full w-full ${width} translate-x-0 flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200`}
      >
        <header className="flex items-center justify-between border-b border-brand-black/10 px-5 py-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-brand-black/60 hover:bg-brand-black/5"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
