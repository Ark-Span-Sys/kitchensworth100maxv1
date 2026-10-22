import { z } from "zod";

/**
 * Zod schemas shared by client form validation and server route handlers.
 * Keep in sync with the DB constraints in `supabase/migrations/001_init.sql`.
 */

export const ngPhone = z
  .string()
  .trim()
  .min(10, "Phone number is too short")
  .max(15, "Phone number is too long")
  .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number");

export const orderDraftSchema = z.object({
  customer_name: z.string().trim().min(2, "Please enter your name"),
  phone: ngPhone,
  email: z.string().email().optional().or(z.literal("")),
  order_type: z.enum(["pickup", "delivery"]),
  zone_id: z.string().uuid().nullable().optional(),
  address: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  payment_provider: z.enum(["monnify_card", "monnify_transfer", "manual_bank"]),
  use_credit: z.boolean().optional(),
  lines: z
    .array(
      z.object({
        key: z.string(),
        kind: z.enum(["menu_item", "party_pack"]),
        refId: z.string().uuid(),
        name: z.string().min(1),
        unitPriceNgn: z.number().int().nonnegative(),
        quantity: z.number().int().positive(),
        extras: z
          .array(z.object({ name: z.string(), priceNgn: z.number().int().nonnegative() }))
          .optional(),
      }),
    )
    .min(1, "Your cart is empty"),
});

export type OrderDraftInput = z.infer<typeof orderDraftSchema>;

export const trackLookupSchema = z.object({
  q: z.string().trim().min(3, "Enter an order code or phone number").max(20),
});
