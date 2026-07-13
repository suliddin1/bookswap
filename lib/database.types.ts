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

export type Database = {
  public: {
    Tables: {
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
        },
        {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          created_at?: string;
        },
        never,
        [
          {
            foreignKeyName: "chat_rooms_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
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
        },
        {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          payload?: Json;
          read?: boolean;
          created_at?: string;
        },
        { read?: boolean },
        [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      listing_status: "draft" | "active" | "sold" | "locked";
      notification_type: "MESSAGE" | "SYSTEM";
    };
    CompositeTypes: Record<string, never>;
  };
};
