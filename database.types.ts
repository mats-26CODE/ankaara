export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null;
          brand_color: string | null;
          capacity: string | null;
          created_at: string;
          currency: string;
          id: string;
          logo_text: string | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          tax_number: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          brand_color?: string | null;
          capacity?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          logo_text?: string | null;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          tax_number?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          brand_color?: string | null;
          capacity?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          logo_text?: string | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          tax_number?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          address: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          business_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          business_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          business_id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          unit_price: number;
          unit: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          unit_price?: number;
          unit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          unit_price?: number;
          unit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      currencies: {
        Row: {
          code: string;
          created_at: string;
          decimal_digits: number;
          is_active: boolean;
          name: string;
          space_between: boolean;
          symbol: string;
          symbol_position: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          decimal_digits?: number;
          is_active?: boolean;
          name: string;
          space_between?: boolean;
          symbol: string;
          symbol_position?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          decimal_digits?: number;
          is_active?: boolean;
          name?: string;
          space_between?: boolean;
          symbol?: string;
          symbol_position?: string;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          description: string;
          discount: number;
          id: string;
          invoice_id: string;
          product_id: string | null;
          quantity: number;
          total: number;
          unit_price: number;
        };
        Insert: {
          description: string;
          discount?: number;
          id?: string;
          invoice_id: string;
          product_id?: string | null;
          quantity?: number;
          total?: number;
          unit_price?: number;
        };
        Update: {
          description?: string;
          discount?: number;
          id?: string;
          invoice_id?: string;
          product_id?: string | null;
          quantity?: number;
          total?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_templates: {
        Row: {
          id: string;
          is_default: boolean;
          layout: Json | null;
          name: string;
          business_id: string;
        };
        Insert: {
          id?: string;
          is_default?: boolean;
          layout?: Json | null;
          name: string;
          business_id: string;
        };
        Update: {
          id?: string;
          is_default?: boolean;
          layout?: Json | null;
          name?: string;
          business_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_templates_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_views: {
        Row: {
          id: string;
          invoice_id: string;
          ip_address: string | null;
          user_agent: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_views_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          accent_color: string | null;
          client_id: string;
          created_at: string;
          currency: string;
          due_date: string;
          footer_note: string | null;
          id: string;
          invoice_number: string;
          issue_date: string;
          notes: string | null;
          business_id: string;
          payment_link: string | null;
          status: string;
          subtotal: number;
          tax: number;
          tax_percentage: number;
          template_id: string;
          total: number;
          updated_at: string;
        };
        Insert: {
          accent_color?: string | null;
          client_id: string;
          created_at?: string;
          currency?: string;
          due_date: string;
          footer_note?: string | null;
          id?: string;
          invoice_number: string;
          issue_date: string;
          notes?: string | null;
          business_id: string;
          payment_link?: string | null;
          status?: string;
          subtotal?: number;
          tax?: number;
          tax_percentage?: number;
          template_id?: string;
          total?: number;
          updated_at?: string;
        };
        Update: {
          accent_color?: string | null;
          client_id?: string;
          created_at?: string;
          currency?: string;
          due_date?: string;
          footer_note?: string | null;
          id?: string;
          invoice_number?: string;
          issue_date?: string;
          notes?: string | null;
          business_id?: string;
          payment_link?: string | null;
          status?: string;
          subtotal?: number;
          tax?: number;
          tax_percentage?: number;
          template_id?: string;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      otp_verification: {
        Row: {
          code: string;
          created_at: string;
          expires_at: string;
          id: string;
          phone: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          phone: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          phone?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      invoice_payment_transactions: {
        Row: {
          created_at: string;
          id: string;
          invoice_payment_id: string;
          provider_transaction_id: string | null;
          raw_payload: Json | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invoice_payment_id: string;
          provider_transaction_id?: string | null;
          raw_payload?: Json | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          invoice_payment_id?: string;
          provider_transaction_id?: string | null;
          raw_payload?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_payment_transactions_invoice_payment_id_fkey";
            columns: ["invoice_payment_id"];
            isOneToOne: false;
            referencedRelation: "invoice_payments";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_payments: {
        Row: {
          amount: number;
          currency: string;
          id: string;
          invoice_id: string;
          paid_at: string | null;
          payment_provider: string;
          reference: string | null;
          status: string;
        };
        Insert: {
          amount: number;
          currency: string;
          id?: string;
          invoice_id: string;
          paid_at?: string | null;
          payment_provider?: string;
          reference?: string | null;
          status?: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          id?: string;
          invoice_id?: string;
          paid_at?: string | null;
          payment_provider?: string;
          reference?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          auth_type: Database["public"]["Enums"]["auth_type"] | null;
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          image_url: Json | null;
          is_active: boolean;
          is_deleted: boolean;
          notification_token: string | null;
          onboarding_completed: boolean;
          phone: string | null;
          phone_number: string | null;
          preferred_currency: string | null;
          updated_at: string | null;
        };
        Insert: {
          auth_type?: Database["public"]["Enums"]["auth_type"] | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          image_url?: Json | null;
          is_active?: boolean;
          is_deleted?: boolean;
          notification_token?: string | null;
          onboarding_completed?: boolean;
          phone?: string | null;
          phone_number?: string | null;
          preferred_currency?: string | null;
          updated_at?: string | null;
        };
        Update: {
          auth_type?: Database["public"]["Enums"]["auth_type"] | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          image_url?: Json | null;
          is_active?: boolean;
          is_deleted?: boolean;
          notification_token?: string | null;
          onboarding_completed?: boolean;
          phone?: string | null;
          phone_number?: string | null;
          preferred_currency?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_currency_fkey";
            columns: ["preferred_currency"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
        ];
      };
      statistics: {
        Row: {
          created_at: string;
          id: string;
          total_admins: number;
          total_businesses: number;
          total_invoices_generated: number;
          total_revenue: number;
          total_subscribed: number;
          total_users: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          total_admins?: number;
          total_businesses?: number;
          total_invoices_generated?: number;
          total_revenue?: number;
          total_subscribed?: number;
          total_users?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          total_admins?: number;
          total_businesses?: number;
          total_invoices_generated?: number;
          total_revenue?: number;
          total_subscribed?: number;
          total_users?: number;
        };
        Relationships: [];
      };
      subscription_payments: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          paid_at: string | null;
          provider_reference: string | null;
          raw_payload: Json | null;
          status: string;
          subscription_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency: string;
          id?: string;
          paid_at?: string | null;
          provider_reference?: string | null;
          raw_payload?: Json | null;
          status?: string;
          subscription_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          paid_at?: string | null;
          provider_reference?: string | null;
          raw_payload?: Json | null;
          status?: string;
          subscription_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_plan_features: {
        Row: {
          created_at: string;
          feature_key: string;
          id: string;
          limit_type: string;
          limit_value: number | null;
          subscription_plan_id: string;
        };
        Insert: {
          created_at?: string;
          feature_key: string;
          id?: string;
          limit_type: string;
          limit_value?: number | null;
          subscription_plan_id: string;
        };
        Update: {
          created_at?: string;
          feature_key?: string;
          id?: string;
          limit_type?: string;
          limit_value?: number | null;
          subscription_plan_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_plan_features_subscription_plan_id_fkey";
            columns: ["subscription_plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_plans: {
        Row: {
          billing_interval: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_contact_sales: boolean;
          name: string;
          plan_tier: string;
          price_amount: number | null;
          price_currency: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          billing_interval?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_contact_sales?: boolean;
          name: string;
          plan_tier?: string;
          price_amount?: number | null;
          price_currency?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          billing_interval?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_contact_sales?: boolean;
          name?: string;
          plan_tier?: string;
          price_amount?: number | null;
          price_currency?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          end_date: string | null;
          id: string;
          plan: string;
          start_date: string;
          status: string;
          subscription_plan_id: string | null;
          user_id: string;
        };
        Insert: {
          end_date?: string | null;
          id?: string;
          plan: string;
          start_date?: string;
          status?: string;
          subscription_plan_id?: string | null;
          user_id: string;
        };
        Update: {
          end_date?: string | null;
          id?: string;
          plan?: string;
          start_date?: string;
          status?: string;
          subscription_plan_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_subscription_plan_id_fkey";
            columns: ["subscription_plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_subscription_expiry: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      get_user_by_phone: {
        Args: { phone_number: string };
        Returns: {
          id: string;
          phone: string;
        }[];
      };
      next_invoice_number: {
        Args: { p_business_id: string };
        Returns: string;
      };
      set_confirmation: {
        Args: { code: string; phone_number: string };
        Returns: string;
      };
    };
    Enums: {
      auth_type: "Google" | "Phone" | "Email";
      period_status: "OPEN" | "CLOSED";
      sales_channel: "CASH" | "MOBILE" | "BANK";
      vat_status: "VAT" | "NON_VAT";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      auth_type: ["Google", "Phone", "Email"],
      period_status: ["OPEN", "CLOSED"],
      sales_channel: ["CASH", "MOBILE", "BANK"],
      vat_status: ["VAT", "NON_VAT"],
    },
  },
} as const;
