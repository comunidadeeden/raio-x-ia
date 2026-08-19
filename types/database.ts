export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationship[];
};

export type EntitlementStatus = "active" | "suspended" | "revoked" | "expired";
export type WebhookStatus = "processing" | "processed" | "failed" | "ignored";

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        { id: string; email: string; full_name: string | null; created_at: string; updated_at: string },
        { id: string; email: string; full_name?: string | null; created_at?: string; updated_at?: string },
        { email?: string; full_name?: string | null; updated_at?: string }
      >;
      products: Table<
        { id: string; hotmart_product_id: string; hotmart_product_ucode: string | null; name: string; slug: string; active: boolean; created_at: string },
        { id?: string; hotmart_product_id: string; hotmart_product_ucode?: string | null; name: string; slug: string; active?: boolean; created_at?: string },
        { hotmart_product_id?: string; hotmart_product_ucode?: string | null; name?: string; slug?: string; active?: boolean }
      >;
      user_entitlements: Table<
        { id: string; user_id: string; product_id: string; status: EntitlementStatus; source: string; hotmart_transaction: string | null; hotmart_subscriber_code: string | null; started_at: string | null; expires_at: string | null; revoked_at: string | null; created_at: string; updated_at: string },
        { id?: string; user_id: string; product_id: string; status?: EntitlementStatus; source?: string; hotmart_transaction?: string | null; hotmart_subscriber_code?: string | null; started_at?: string | null; expires_at?: string | null; revoked_at?: string | null; created_at?: string; updated_at?: string },
        { status?: EntitlementStatus; source?: string; hotmart_transaction?: string | null; hotmart_subscriber_code?: string | null; started_at?: string | null; expires_at?: string | null; revoked_at?: string | null; updated_at?: string }
      >;
      conversations: Table<
        { id: string; user_id: string; title: string; created_at: string; updated_at: string },
        { id?: string; user_id: string; title: string; created_at?: string; updated_at?: string },
        { title?: string; updated_at?: string }
      >;
      messages: Table<
        { id: string; conversation_id: string; client_message_id: string | null; role: "user" | "assistant"; content: string; created_at: string },
        { id?: string; conversation_id: string; client_message_id?: string | null; role: "user" | "assistant"; content: string; created_at?: string },
        never
      >;
      webhook_events: Table<
        { id: string; provider: string; external_event_id: string; event_type: string; payload: Json; status: WebhookStatus; processed_at: string | null; created_at: string; updated_at: string; error_message: string | null },
        { id?: string; provider: string; external_event_id: string; event_type: string; payload: Json; status?: WebhookStatus; processed_at?: string | null; created_at?: string; updated_at?: string; error_message?: string | null },
        { status?: WebhookStatus; processed_at?: string | null; updated_at?: string; error_message?: string | null }
      >;
      chat_rate_limits: Table<
        { user_id: string; window_started_at: string; request_count: number },
        { user_id: string; window_started_at?: string; request_count?: number },
        { window_started_at?: string; request_count?: number }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      has_active_entitlement: {
        Args: { product_slug: string };
        Returns: boolean;
      };
      consume_chat_rate_limit: {
        Args: { request_limit: number; window_seconds: number };
        Returns: boolean;
      };
      admin_find_auth_user_by_email: {
        Args: { lookup_email: string };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
