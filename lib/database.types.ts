export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<
  Row,
  Insert,
  Update,
  Relationships extends readonly unknown[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

type Timestamps = { created_at: string };

type PublicListingPageRow = Timestamps & {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn: string | null;
  price: number;
  original_price: number | null;
  images: string[];
  category: string;
  condition: string;
  city: string;
  status: "draft" | "active" | "sold" | "locked";
  seller_id: string;
  seller: Json;
};

export type Database = {
  public: {
    Tables: {
      admin_audit_log: Table<
        Timestamps & {
          id: string;
          actor_id: string;
          actor_name: string;
          target_type: string;
          target_id: string;
          action: string;
          reason: string;
          before_state: Json;
          after_state: Json;
        },
        never,
        never,
        []
      >;
      users: Table<
        Timestamps & {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          city: string | null;
          banned: boolean;
          is_admin: boolean;
        },
        {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          city?: string | null;
          banned?: boolean;
          is_admin?: boolean;
          created_at?: string;
        },
        {
          name?: string;
          email?: string;
          phone?: string | null;
          city?: string | null;
          banned?: boolean;
          is_admin?: boolean;
        },
        []
      >;
      legal_acceptances: Table<
        {
          user_id: string;
          terms_version: string;
          privacy_version: string;
          marketplace_rules_version: string;
          age_18_plus_confirmed: boolean;
          personal_data_processing_consent: boolean;
          cross_border_transfer_disclosed_and_consented: boolean;
          accepted_at: string;
        },
        never,
        never,
        []
      >;
      listings: Table<
        Timestamps & {
          id: string;
          title: string;
          author: string;
          description: string;
          isbn: string | null;
          price: number;
          original_price: number | null;
          images: string[];
          category: string;
          condition: string;
          city: string;
          status: Database["public"]["Enums"]["listing_status"];
          seller_id: string;
          search: unknown;
        },
        {
          id?: string;
          title: string;
          author?: string;
          description: string;
          isbn?: string | null;
          price: number;
          original_price?: number | null;
          images?: string[];
          category: string;
          condition: string;
          city: string;
          status?: Database["public"]["Enums"]["listing_status"];
          seller_id: string;
          created_at?: string;
        },
        {
          title?: string;
          author?: string;
          description?: string;
          isbn?: string | null;
          price?: number;
          original_price?: number | null;
          images?: string[];
          category?: string;
          condition?: string;
          city?: string;
          status?: Database["public"]["Enums"]["listing_status"];
        },
        [
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ]
      >;
      chat_rooms: Table<
        Timestamps & {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          last_message_at: string;
        },
        {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          created_at?: string;
          last_message_at?: string;
        },
        { last_message_at?: string },
        [
          {
            foreignKeyName: "chat_rooms_listing_id_fkey";
            columns: ["listing_id", "seller_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id", "seller_id"];
          },
          {
            foreignKeyName: "chat_rooms_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_rooms_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ]
      >;
      chat_room_reads: Table<
        Timestamps & {
          room_id: string;
          user_id: string;
          unread_count: number;
          last_read_at: string | null;
          updated_at: string;
        },
        {
          room_id: string;
          user_id: string;
          unread_count?: number;
          last_read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          unread_count?: number;
          last_read_at?: string | null;
          updated_at?: string;
        },
        [
          {
            foreignKeyName: "chat_room_reads_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_room_reads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ]
      >;
      messages: Table<
        Timestamps & {
          id: string;
          room_id: string;
          sender_id: string;
          text: string;
        },
        {
          id?: string;
          room_id: string;
          sender_id?: string;
          text: string;
          created_at?: string;
        },
        never,
        [
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ]
      >;
      reviews: Table<
        Timestamps & {
          id: string;
          listing_id: string;
          rating: number;
          comment: string;
          author_id: string;
        },
        {
          id?: string;
          listing_id: string;
          rating: number;
          comment: string;
          author_id?: string;
          created_at?: string;
        },
        never,
        [
          {
            foreignKeyName: "reviews_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ]
      >;
      notifications: Table<
        Timestamps & {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          payload: Json;
          read: boolean;
          message_id: string | null;
        },
        {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          payload?: Json;
          read?: boolean;
          message_id?: string | null;
          created_at?: string;
        },
        { read?: boolean; message_id?: string | null },
        [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ]
      >;
      favorites: Table<
        Timestamps & { user_id: string; listing_id: string },
        { user_id: string; listing_id: string; created_at?: string },
        never,
        [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ]
      >;
      reports: Table<
        Timestamps & {
          id: string;
          reporter_id: string;
          listing_id: string | null;
          reason: string;
          status: string;
        },
        {
          id?: string;
          reporter_id: string;
          listing_id?: string | null;
          reason: string;
          status?: string;
          created_at?: string;
        },
        { status?: string },
        [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ]
      >;
      listing_image_cleanup_jobs: Table<
        Timestamps & {
          id: number;
          user_id: string;
          listing_id: string | null;
          image_url: string;
          attempts: number;
          last_error: string | null;
          updated_at: string;
        },
        {
          id?: number;
          user_id: string;
          listing_id?: string | null;
          image_url: string;
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          listing_id?: string | null;
          attempts?: number;
          last_error?: string | null;
          updated_at?: string;
        },
        []
      >;
      privacy_requests: Table<
        Timestamps & {
          id: string;
          user_id: string;
          type: string;
          details: string;
          status: string;
          resolved_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          type: string;
          details: string;
          status?: string;
          created_at?: string;
          resolved_at?: string | null;
        },
        { status?: string; resolved_at?: string | null },
        [
          {
            foreignKeyName: "privacy_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ]
      >;
      moderation_decisions: Table<
        Timestamps & {
          id: string;
          request_id: string;
          actor_id: string | null;
          surface: string;
          target_id: string | null;
          content_type: string;
          provider: string;
          outcome: string;
          reason_code: string;
          categories: string[];
          provider_decision_id: string | null;
        },
        {
          id?: string;
          request_id: string;
          actor_id?: string | null;
          surface: string;
          target_id?: string | null;
          content_type: string;
          provider: string;
          outcome: string;
          reason_code: string;
          categories?: string[];
          provider_decision_id?: string | null;
          created_at?: string;
        },
        never,
        [
          {
            foreignKeyName: "moderation_decisions_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ]
      >;
    };
    Views: Record<string, never>;
    Functions: {
      catalog_listings_page: {
        Args: {
          p_query: string;
          p_category: string | null;
          p_city: string | null;
          p_condition: string | null;
          p_max_price: number | null;
          p_sort: string;
          p_cursor_created_at: string | null;
          p_cursor_price: number | null;
          p_cursor_id: string | null;
          p_limit: number;
        };
        Returns: PublicListingPageRow[];
      };
      consume_rate_limit: {
        Args: {
          p_scope: string;
          p_key_hash: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          retry_after_seconds: number;
        }[];
      };
      seller_listings_page: {
        Args: {
          p_seller_id: string;
          p_cursor_created_at: string | null;
          p_cursor_id: string | null;
          p_limit: number;
        };
        Returns: PublicListingPageRow[];
      };
      admin_set_user_ban: {
        Args: {
          p_actor_id: string;
          p_target_id: string;
          p_banned: boolean;
          p_reason: string;
        };
        Returns: Json;
      };
      admin_moderate_listing: {
        Args: {
          p_actor_id: string;
          p_listing_id: string;
          p_action: string;
          p_reason: string;
        };
        Returns: Json;
      };
      admin_resolve_report: {
        Args: {
          p_actor_id: string;
          p_report_id: string;
          p_status: string;
          p_reason: string;
        };
        Returns: Json;
      };
      admin_resolve_privacy_request: {
        Args: {
          p_actor_id: string;
          p_request_id: string;
          p_status: string;
          p_reason: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      listing_status: "draft" | "active" | "sold" | "locked";
      notification_type: "MESSAGE" | "SYSTEM";
    };
    CompositeTypes: Record<string, never>;
  };
};
