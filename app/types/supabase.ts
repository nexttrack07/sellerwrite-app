export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      descriptions: {
        Row: {
          analysis_data: Json | null
          content: string
          created_at: string | null
          id: number
          is_current: boolean | null
          keywords_used: string[] | null
          listing_id: number | null
          version_number: number
        }
        Insert: {
          analysis_data?: Json | null
          content: string
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          keywords_used?: string[] | null
          listing_id?: number | null
          version_number: number
        }
        Update: {
          analysis_data?: Json | null
          content?: string
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          keywords_used?: string[] | null
          listing_id?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "descriptions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          analysis_data: Json | null
          content: string[]
          created_at: string | null
          id: number
          is_current: boolean | null
          keywords_used: string[] | null
          listing_id: number | null
          version_number: number
        }
        Insert: {
          analysis_data?: Json | null
          content: string[]
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          keywords_used?: string[] | null
          listing_id?: number | null
          version_number: number
        }
        Update: {
          analysis_data?: Json | null
          content?: string[]
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          keywords_used?: string[] | null
          listing_id?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "features_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      product_listings: {
        Row: {
          asins: Json
          created_at: string | null
          current_description_id: number | null
          current_features_id: number | null
          current_title_id: number | null
          id: number
          marketplace: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asins: Json
          created_at?: string | null
          current_description_id?: number | null
          current_features_id?: number | null
          current_title_id?: number | null
          id?: number
          marketplace: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asins?: Json
          created_at?: string | null
          current_description_id?: number | null
          current_features_id?: number | null
          current_title_id?: number | null
          id?: number
          marketplace?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_listings_current_description_id_fkey"
            columns: ["current_description_id"]
            isOneToOne: false
            referencedRelation: "descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_listings_current_features_id_fkey"
            columns: ["current_features_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_listings_current_title_id_fkey"
            columns: ["current_title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          analysis_data: Json | null
          content: string
          created_at: string | null
          id: number
          is_current: boolean | null
          keywords_used: string[] | null
          listing_id: number | null
          version_number: number
        }
        Insert: {
          analysis_data?: Json | null
          content: string
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          keywords_used?: string[] | null
          listing_id?: number | null
          version_number: number
        }
        Update: {
          analysis_data?: Json | null
          content?: string
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          keywords_used?: string[] | null
          listing_id?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "titles_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      style:
        | "professional"
        | "conversational"
        | "enthusiastic"
        | "benefit-focused"
        | "problem-solution"
        | "technical"
        | "premium"
        | "lifestyle"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
