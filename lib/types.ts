/**
 * Shared domain types for Kitchen's Worth.
 * Database row types live in `types/database.ts` (generated); these are
 * the view-model shapes used by components and API routes.
 */

export type OrderType = "pickup" | "delivery";

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export type PaymentProviderKey = "monnify_card" | "monnify_transfer" | "manual_bank";

export interface CartLine {
  /** Stable key: `${kind}:${refId}` (kind = menu_item | party_pack) */
  key: string;
  kind: "menu_item" | "party_pack";
  refId: string;
  name: string;
  unitPriceNgn: number;
  quantity: number;
  image_url?: string | null;
  extras?: { name: string; priceNgn: number }[];
}

export interface Zone {
  id: string;
  city_id: string;
  name: string;
  area_label: string;
  eta_minutes: number;
  fee_ngn: number;
  is_active: boolean;
}

export interface City {
  id: string;
  slug: string;
  name: string;
  state: string;
  is_active: boolean;
}

export interface SiteSettings {
  whatsapp_number: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  opening_hours: Record<string, string>;
  ticker_messages: string[];
  tagline: string;
  vat_percent: number;
  dock_enabled: boolean;
  dock_config: string[];
}

export interface OrderDraft {
  customer_name: string;
  phone: string;
  email?: string | null;
  order_type: OrderType;
  zone_id?: string | null;
  address?: string | null;
  notes?: string | null;
  payment_provider: PaymentProviderKey;
  lines: CartLine[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  image_url: string | null;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  ingredients: string[];
  price_ngn: number;
  image_url: string | null;
  is_best_seller: boolean;
  is_signature: boolean;
  is_spicy: boolean;
  is_vegan: boolean;
  stock_today: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface MenuExtra {
  id: string;
  item_id: string;
  name: string;
  price_ngn: number;
  is_required: boolean;
}

export interface PartyPack {
  id: string;
  slug: string;
  name: string;
  serves_min: number;
  serves_max: number;
  price_ngn: number;
  contents: string[];
  image_url: string | null;
  is_active: boolean;
}

export interface CateringPackage {
  id: string;
  name: string;
  tier: string;
  price_ngn: number;
  description: string | null;
  image_url: string | null;
}

export interface PaymentProviderRow {
  key: PaymentProviderKey;
  label: string;
  description: string | null;
  is_enabled: boolean;
  sort_order: number;
}

export interface BankDetails {
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
}

export interface TrackableOrder {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal_ngn: number;
  delivery_fee_ngn: number;
  discount_ngn: number;
  total_ngn: number;
  payment_provider: PaymentProviderKey | null;
  estimated_minutes: number | null;
  created_at: string;
  items?: { item_name_snapshot: string; quantity: number; unit_price_snapshot: number }[];
}

