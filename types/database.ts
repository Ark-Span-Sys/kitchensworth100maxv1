/**
 * types/database.ts
 * ---------------------------------------------------------------------------
 * Hand-authored mirror of the Postgres schema defined in
 * `supabase/migrations/001_init.sql` … `005_seed.sql`.
 *
 * In a live project this file is regenerated with:
 *     pnpm gen:types      # shells out to `supabase gen types typescript`
 *
 * It is committed to the repo so `pnpm build` works without a running
 * Supabase instance. Keep it in sync with the migrations.
 *
 * Consumed by `createClient<Database>()` in `lib/supabase/{client,server,admin}.ts`
 * to give every `.from("table")` call end-to-end type safety.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------------
// Enumerated union types (mirror the `create type … as enum` statements)
// ---------------------------------------------------------------------------
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

export type OrderItemKind = "menu_item" | "party_pack";

export type _OrderType = OrderType;
export type _OrderStatus = OrderStatus;
export type _PaymentProviderKey = PaymentProviderKey;
export type _OrderItemKind = OrderItemKind;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
      };
      cities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          state: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          state: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          state?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      zones: {
        Row: {
          id: string;
          city_id: string;
          name: string;
          area_label: string;
          eta_minutes: number;
          fee_ngn: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          city_id: string;
          name: string;
          area_label: string;
          eta_minutes: number;
          fee_ngn: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["zones"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      menu_items: {
        Row: {
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
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          slug: string;
          name: string;
          description?: string | null;
          ingredients?: string[];
          price_ngn: number;
          image_url?: string | null;
          is_best_seller?: boolean;
          is_signature?: boolean;
          is_spicy?: boolean;
          is_vegan?: boolean;
          stock_today?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
      };
      menu_extras: {
        Row: {
          id: string;
          item_id: string;
          name: string;
          price_ngn: number;
          is_required: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          item_id: string;
          name: string;
          price_ngn: number;
          is_required?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["menu_extras"]["Insert"]>;
      };
      party_packs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          serves_min: number;
          serves_max: number;
          price_ngn: number;
          contents: string[];
          image_url: string | null;
          description: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          serves_min: number;
          serves_max: number;
          price_ngn: number;
          contents?: string[];
          image_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["party_packs"]["Insert"]>;
      };
      bulk_tiers: {
        Row: {
          id: string;
          min_qty: number;
          discount_percent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          min_qty: number;
          discount_percent: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bulk_tiers"]["Insert"]>;
      };
      catering_packages: {
        Row: {
          id: string;
          name: string;
          tier: string;
          price_ngn: number;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          tier: string;
          price_ngn: number;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["catering_packages"]["Insert"]>;
      };
      payment_providers: {
        Row: {
          key: PaymentProviderKey;
          label: string;
          description: string | null;
          is_enabled: boolean;
          sort_order: number;
        };
        Insert: {
          key: PaymentProviderKey;
          label: string;
          description?: string | null;
          is_enabled?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["payment_providers"]["Insert"]>;
      };
      site_settings: {
        Row: {
          id: number;
          whatsapp_number: string;
          bank_name: string | null;
          bank_account_name: string | null;
          bank_account_number: string | null;
          opening_hours: Json;
          ticker_messages: string[];
          tagline: string;
          vat_percent: number;
          dock_enabled: boolean;
          dock_config: Json;
          updated_at: string;
        };
        Insert: {
          id?: number;
          whatsapp_number: string;
          bank_name?: string | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          opening_hours?: Json;
          ticker_messages?: string[];
          tagline?: string;
          vat_percent?: number;
          dock_enabled?: boolean;
          dock_config?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          phone: string;
          email: string | null;
          order_type: OrderType;
          zone_id: string | null;
          address: string | null;
          status: OrderStatus;
          subtotal_ngn: number;
          delivery_fee_ngn: number;
          discount_ngn: number;
          total_ngn: number;
          payment_provider: PaymentProviderKey | null;
          monnify_reference: string | null;
          estimated_minutes: number | null;
          notes: string | null;
          whatsapp_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_name: string;
          phone: string;
          email?: string | null;
          order_type: OrderType;
          zone_id?: string | null;
          address?: string | null;
          status?: OrderStatus;
          subtotal_ngn: number;
          delivery_fee_ngn?: number;
          discount_ngn?: number;
          total_ngn: number;
          payment_provider?: PaymentProviderKey | null;
          monnify_reference?: string | null;
          estimated_minutes?: number | null;
          notes?: string | null;
          whatsapp_sent_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          kind: OrderItemKind;
          ref_id: string;
          item_name_snapshot: string;
          unit_price_snapshot: number;
          quantity: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          kind: OrderItemKind;
          ref_id: string;
          item_name_snapshot: string;
          unit_price_snapshot: number;
          quantity: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      order_status_events: {
        Row: {
          id: string;
          order_id: string;
          from_status: OrderStatus | null;
          to_status: OrderStatus;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: OrderStatus | null;
          to_status: OrderStatus;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_events"]["Insert"]>;
      };
    };
    Views: { [key: string]: never };
    Functions: {
      view_bank: { Args: Record<string, never>; Returns: Json };
    };
    Enums: {
      order_type: OrderType;
      order_status: OrderStatus;
      payment_provider_key: PaymentProviderKey;
      order_item_kind: OrderItemKind;
    };
  };
};
