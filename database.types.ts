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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null
          brand_color: string | null
          capacity: string | null
          created_at: string
          currency: string
          id: string
          logo_text: string | null
          logo_url: string | null
          name: string
          owner_id: string
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          capacity?: string | null
          created_at?: string
          currency?: string
          id?: string
          logo_text?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          capacity?: string | null
          created_at?: string
          currency?: string
          id?: string
          logo_text?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          decimal_digits: number
          is_active: boolean
          name: string
          space_between: boolean
          symbol: string
          symbol_position: string
        }
        Insert: {
          code: string
          created_at?: string
          decimal_digits?: number
          is_active?: boolean
          name: string
          space_between?: boolean
          symbol: string
          symbol_position?: string
        }
        Update: {
          code?: string
          created_at?: string
          decimal_digits?: number
          is_active?: boolean
          name?: string
          space_between?: boolean
          symbol?: string
          symbol_position?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          id: string
          is_default: boolean
          layout: Json | null
          name: string
          organization_id: string
        }
        Insert: {
          id?: string
          is_default?: boolean
          layout?: Json | null
          name: string
          organization_id: string
        }
        Update: {
          id?: string
          is_default?: boolean
          layout?: Json | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_views: {
        Row: {
          id: string
          invoice_id: string
          ip_address: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_views_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          accent_color: string | null
          client_id: string
          created_at: string
          currency: string
          due_date: string
          footer_note: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          payment_link: string | null
          status: string
          subtotal: number
          tax: number
          template_id: string
          total: number
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          client_id: string
          created_at?: string
          currency?: string
          due_date: string
          footer_note?: string | null
          id?: string
          invoice_number: string
          issue_date: string
          notes?: string | null
          organization_id: string
          payment_link?: string | null
          status?: string
          subtotal?: number
          tax?: number
          template_id?: string
          total?: number
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          footer_note?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          payment_link?: string | null
          status?: string
          subtotal?: number
          tax?: number
          template_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verification: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          created_at: string
          id: string
          payment_id: string
          provider_transaction_id: string | null
          raw_payload: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id: string
          provider_transaction_id?: string | null
          raw_payload?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string
          provider_transaction_id?: string | null
          raw_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          currency: string
          id: string
          invoice_id: string
          paid_at: string | null
          payment_provider: string
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          currency: string
          id?: string
          invoice_id: string
          paid_at?: string | null
          payment_provider?: string
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          invoice_id?: string
          paid_at?: string | null
          payment_provider?: string
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          auth_type: Database["public"]["Enums"]["auth_type"] | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          image_url: Json | null
          is_active: boolean
          is_deleted: boolean
          notification_token: string | null
          onboarding_completed: boolean
          phone: string | null
          phone_number: string | null
          preferred_currency: string | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          auth_type?: Database["public"]["Enums"]["auth_type"] | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          image_url?: Json | null
          is_active?: boolean
          is_deleted?: boolean
          notification_token?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          phone_number?: string | null
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          auth_type?: Database["public"]["Enums"]["auth_type"] | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          image_url?: Json | null
          is_active?: boolean
          is_deleted?: boolean
          notification_token?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          phone_number?: string | null
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_currency_fkey"
            columns: ["preferred_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      statistics: {
        Row: {
          created_at: string
          id: string
          total_admins: number
          total_businesses: number
          total_invoices_generated: number
          total_revenue: number
          total_subscribed: number
          total_users: number
        }
        Insert: {
          created_at?: string
          id?: string
          total_admins?: number
          total_businesses?: number
          total_invoices_generated?: number
          total_revenue?: number
          total_subscribed?: number
          total_users?: number
        }
        Update: {
          created_at?: string
          id?: string
          total_admins?: number
          total_businesses?: number
          total_invoices_generated?: number
          total_revenue?: number
          total_subscribed?: number
          total_users?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          end_date: string | null
          id: string
          organization_id: string
          plan: string
          start_date: string
          status: string
        }
        Insert: {
          end_date?: string | null
          id?: string
          organization_id: string
          plan: string
          start_date?: string
          status?: string
        }
        Update: {
          end_date?: string | null
          id?: string
          organization_id?: string
          plan?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_by_phone: {
        Args: { phone_number: string }
        Returns: {
          id: string
          phone: string
        }[]
      }
      next_invoice_number: {
        Args: { p_organization_id: string }
        Returns: string
      }
      set_confirmation: {
        Args: { code: string; phone_number: string }
        Returns: string
      }
    }
    Enums: {
      auth_type: "Google" | "Phone" | "Email"
      period_status: "OPEN" | "CLOSED"
      sales_channel: "CASH" | "MOBILE" | "BANK"
      vat_status: "VAT" | "NON_VAT"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      auth_type: ["Google", "Phone", "Email"],
      period_status: ["OPEN", "CLOSED"],
      sales_channel: ["CASH", "MOBILE", "BANK"],
      vat_status: ["VAT", "NON_VAT"],
    },
  },
} as const
