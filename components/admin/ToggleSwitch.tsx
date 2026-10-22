"use client";

/**
 * On/off switch used across admin settings pages (payment providers, dock,
 * city activation, etc.). Renders as a proper checkbox for a11y.
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  hint,
  disabled,
  name,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 inline-block h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-brand-green" : "bg-brand-black/15"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="muted block text-xs">{hint}</span>}
      </span>
    </label>
  );
}
