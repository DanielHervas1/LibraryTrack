export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string
          date: string
          detail: Json
          entry_id: string
          id: string
          kind: Database["public"]["Enums"]["activity_kind"]
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          detail?: Json
          entry_id: string
          id?: string
          kind: Database["public"]["Enums"]["activity_kind"]
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          detail?: Json
          entry_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          authors: string[]
          cover_url: string | null
          created_at: string
          current_episode: number | null
          current_page: number | null
          current_season: number | null
          episode_minutes: number | null
          external_id: string | null
          finished_at: string | null
          genres: string[]
          id: string
          is_favorite: boolean
          is_private: boolean
          media_type: Database["public"]["Enums"]["media_type"]
          metadata: Json
          original_title: string | null
          priority: number | null
          provider: Database["public"]["Enums"]["provider"]
          release_year: number | null
          review: string | null
          rewatch_count: number
          runtime_minutes: number | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["entry_status"]
          synopsis: string | null
          title: string
          total_episodes: number | null
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          authors?: string[]
          cover_url?: string | null
          created_at?: string
          current_episode?: number | null
          current_page?: number | null
          current_season?: number | null
          episode_minutes?: number | null
          external_id?: string | null
          finished_at?: string | null
          genres?: string[]
          id?: string
          is_favorite?: boolean
          is_private?: boolean
          media_type: Database["public"]["Enums"]["media_type"]
          metadata?: Json
          original_title?: string | null
          priority?: number | null
          provider?: Database["public"]["Enums"]["provider"]
          release_year?: number | null
          review?: string | null
          rewatch_count?: number
          runtime_minutes?: number | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          synopsis?: string | null
          title: string
          total_episodes?: number | null
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          authors?: string[]
          cover_url?: string | null
          created_at?: string
          current_episode?: number | null
          current_page?: number | null
          current_season?: number | null
          episode_minutes?: number | null
          external_id?: string | null
          finished_at?: string | null
          genres?: string[]
          id?: string
          is_favorite?: boolean
          is_private?: boolean
          media_type?: Database["public"]["Enums"]["media_type"]
          metadata?: Json
          original_title?: string | null
          priority?: number | null
          provider?: Database["public"]["Enums"]["provider"]
          release_year?: number | null
          review?: string | null
          rewatch_count?: number
          runtime_minutes?: number | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          synopsis?: string | null
          title?: string
          total_episodes?: number | null
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entry_tags: {
        Row: {
          created_at: string
          entry_id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          tag_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_tags_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          name_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_key?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_kind: "started" | "progress" | "finished" | "rewatched"
      entry_status:
        | "planned"
        | "in_progress"
        | "paused"
        | "completed"
        | "dropped"
      media_type: "movie" | "tv" | "anime" | "book"
      provider: "tmdb" | "anilist" | "google_books" | "manual" | "open_library"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_kind: ["started", "progress", "finished", "rewatched"],
      entry_status: [
        "planned",
        "in_progress",
        "paused",
        "completed",
        "dropped",
      ],
      media_type: ["movie", "tv", "anime", "book"],
      provider: ["tmdb", "anilist", "google_books", "manual", "open_library"],
    },
  },
} as const
