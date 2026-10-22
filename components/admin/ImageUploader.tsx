"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Admin image uploader. Requests a signed upload URL from /api/uploads,
 * PUTs the file directly to Supabase Storage, and reports the public URL
 * back to the parent form via onChange.
 */
export function ImageUploader({
  value,
  onChange,
  bucket = "menu-images",
  label = "Image",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(f: File) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bucket, filename: f.name, contentType: f.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Upload failed");

      const put = await fetch(data.signedUrl, {
        method: "PUT",
        headers: { "content-type": f.type },
        body: f,
      });
      if (!put.ok) throw new Error("Storage rejected the file");
      onChange(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-black/5">
          {value ? (
            <Image src={value} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-black/30">No image</div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pick(f);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn-secondary text-xs"
        >
          {busy ? "Uploading..." : value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
}
