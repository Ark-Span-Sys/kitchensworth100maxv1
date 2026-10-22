"use client";
import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = "", ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className="block">
      {label && (
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
          {label}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? "true" : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green ${
          error ? "border-red-500" : "border-brand-black/15"
        } ${className}`}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
      {!error && hint && <span className="mt-1 block text-xs text-brand-black/50">{hint}</span>}
    </label>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  function Textarea({ label, error, id, className = "", ...rest }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <label htmlFor={inputId} className="block">
        {label && (
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
            {label}
          </span>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green ${
            error ? "border-red-500" : "border-brand-black/15"
          } ${className}`}
          {...rest}
        />
        {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
      </label>
    );
  },
);
