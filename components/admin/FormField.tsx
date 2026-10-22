import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

/**
 * Server-safe form field wrappers for admin CRUD pages.
 * Native inputs (no client JS) so server actions can read FormData directly.
 */
export function FormField({
  label,
  name,
  hint,
  required,
  type = "text",
  defaultValue,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green"
        {...rest}
      />
      {hint && <span className="muted mt-1 block text-xs">{hint}</span>}
    </label>
  );
}

export function FormTextarea({
  label,
  name,
  hint,
  rows = 4,
  defaultValue,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green"
        {...rest}
      />
      {hint && <span className="muted mt-1 block text-xs">{hint}</span>}
    </label>
  );
}

export function FormSelect({
  label,
  name,
  options,
  defaultValue,
  hint,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green"
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="muted mt-1 block text-xs">{hint}</span>}
    </label>
  );
}

export function FormShell({
  title,
  children,
  footer,
  action,
  method = "post",
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: string;
  method?: "post" | "get";
}) {
  return (
    <form action={action} method={method} className="card mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="heading-lg">{title}</h1>
      {children}
      <div className="flex items-center justify-end gap-3 border-t border-brand-black/5 pt-4">
        {footer}
      </div>
    </form>
  );
}
