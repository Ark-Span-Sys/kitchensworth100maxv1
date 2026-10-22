"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { FormField, FormTextarea, FormSelect } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface CategoryOption {
  id: string;
  name: string;
}

interface ItemValues {
  id?: string;
  name?: string;
  category_id?: string;
  price_ngn?: number;
  description?: string | null;
  ingredients?: string[];
  image_url?: string | null;
  sort_order?: number;
  stock_today?: number | null;
  is_active?: boolean;
  is_best_seller?: boolean;
  is_signature?: boolean;
  is_spicy?: boolean;
  is_vegan?: boolean;
}

/**
 * Create / edit form for a menu item. Client-owned because it uses the
 * ImageUploader island and manages a hidden input for the image URL.
 * Calls the server action via useFormState so validation errors surface inline.
 */
export function MenuItemForm({
  action,
  categories,
  initial,
  submitLabel = "Save item",
}: {
  action: (fd: FormData) => Promise<void>;
  categories: CategoryOption[];
  initial?: ItemValues;
  submitLabel?: string;
}) {
  const [image, setImage] = useState<string | null>(initial?.image_url ?? null);

  return (
    <form action={action} className="card mx-auto max-w-2xl space-y-4 p-6">

      <FormField label="Name" name="name" required defaultValue={initial?.name} />
      <FormSelect
        label="Category"
        name="category_id"
        required
        defaultValue={initial?.category_id}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <FormField
        label="Price (₦, VAT-inclusive)"
        name="price_ngn"
        type="number"
        min={0}
        step={50}
        required
        defaultValue={initial?.price_ngn ?? 0}
      />
      <FormTextarea label="Description" name="description" defaultValue={initial?.description ?? ""} rows={3} />
      <FormField
        label="Ingredients (comma-separated)"
        name="ingredients"
        hint="e.g. brown rice, grilled chicken, pepper sauce"
        defaultValue={(initial?.ingredients ?? []).join(", ")}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Sort order"
          name="sort_order"
          type="number"
          defaultValue={initial?.sort_order ?? 0}
        />
        <FormField
          label="Stock today (blank = unlimited)"
          name="stock_today"
          type="number"
          min={0}
          defaultValue={initial?.stock_today ?? ""}
        />
      </div>

      <fieldset className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} className="h-4 w-4 accent-brand-green" />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_best_seller" defaultChecked={initial?.is_best_seller} className="h-4 w-4 accent-brand-green" />
          Best seller
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_signature" defaultChecked={initial?.is_signature} className="h-4 w-4 accent-brand-green" />
          Signature
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_spicy" defaultChecked={initial?.is_spicy} className="h-4 w-4 accent-brand-green" />
          Spicy
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_vegan" defaultChecked={initial?.is_vegan} className="h-4 w-4 accent-brand-green" />
          Vegan
        </label>
      </fieldset>

      <ImageUploader value={image} onChange={setImage} />
      <input type="hidden" name="image_url" value={image ?? ""} />

      <div className="flex justify-end gap-3 border-t border-brand-black/5 pt-4">
        <Link href="/admin/menu" className="btn-secondary">
          Cancel
        </Link>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
