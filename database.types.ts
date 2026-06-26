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
      business_staff: {
        Row: {
          business_id: string
          id: string
          invited_at: string
          invited_by: string
          joined_at: string | null
          removed_at: string | null
          staff_category_id: string
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          id?: string
          invited_at?: string
          invited_by: string
          joined_at?: string | null
          removed_at?: string | null
          staff_category_id: string
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
          joined_at?: string | null
          removed_at?: string | null
          staff_category_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_staff_category_id_fkey"
            columns: ["staff_category_id"]
            isOneToOne: false
            referencedRelation: "staff_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          brand_color: string | null
          capacity: string | null
          created_at: string
          currency: string
          id: string
          is_primary: boolean
          logo_text: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          second_phone: string | null
          send_sale_alert: boolean
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
          is_primary?: boolean
          logo_text?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          second_phone?: string | null
          send_sale_alert?: boolean
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
          is_primary?: boolean
          logo_text?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          second_phone?: string | null
          send_sale_alert?: boolean
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
          business_id: string
          created_at: string
          email: string | null
          id: string
          is_walk_in: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_walk_in?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_walk_in?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
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
      expense_categories: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          is_active: boolean
          is_other: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_other?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_other?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          category_id: string | null
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          notes: string | null
          payment_method: string
          updated_at: string
        }
        Insert: {
          amount: number
          business_id: string
          category: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_delta: number
          reason: string | null
          sale_id: string | null
          sale_item_id: string | null
          unit_cost: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_delta: number
          reason?: string | null
          sale_id?: string | null
          sale_item_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          product_id?: string
          quantity_after?: number
          quantity_before?: number
          quantity_delta?: number
          reason?: string | null
          sale_id?: string | null
          sale_item_id?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string
          discount: number
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          description: string
          discount?: number
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          description?: string
          discount?: number
          id?: string
          invoice_id?: string
          product_id?: string | null
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
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payment_transactions: {
        Row: {
          created_at: string
          id: string
          invoice_payment_id: string
          provider_transaction_id: string | null
          raw_payload: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_payment_id: string
          provider_transaction_id?: string | null
          raw_payload?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_payment_id?: string
          provider_transaction_id?: string | null
          raw_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payment_transactions_invoice_payment_id_fkey"
            columns: ["invoice_payment_id"]
            isOneToOne: false
            referencedRelation: "invoice_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
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
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          business_id: string
          id: string
          is_default: boolean
          layout: Json | null
          name: string
        }
        Insert: {
          business_id: string
          id?: string
          is_default?: boolean
          layout?: Json | null
          name: string
        }
        Update: {
          business_id?: string
          id?: string
          is_default?: boolean
          layout?: Json | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_business_id_fkey"
            columns: ["business_id"]
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
          business_id: string
          client_id: string
          created_at: string
          currency: string
          due_date: string
          footer_note: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          payment_link: string | null
          quotation_id: string | null
          status: string
          subtotal: number
          tax: number
          tax_percentage: number
          template_id: string
          total: number
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          accent_color?: string | null
          business_id: string
          client_id: string
          created_at?: string
          currency?: string
          due_date: string
          footer_note?: string | null
          id?: string
          invoice_number: string
          issue_date: string
          notes?: string | null
          payment_link?: string | null
          quotation_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_percentage?: number
          template_id?: string
          total?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          accent_color?: string | null
          business_id?: string
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          footer_note?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          payment_link?: string | null
          quotation_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_percentage?: number
          template_id?: string
          total?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_items: {
        Row: {
          base_price: number
          cost_total: number
          description: string
          discount: number
          id: string
          item_type: string
          loan_id: string
          product_id: string | null
          profit: number
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          base_price?: number
          cost_total?: number
          description: string
          discount?: number
          id?: string
          item_type?: string
          loan_id: string
          product_id?: string | null
          profit?: number
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          base_price?: number
          cost_total?: number
          description?: string
          discount?: number
          id?: string
          item_type?: string
          loan_id?: string
          product_id?: string | null
          profit?: number
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_items_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          loan_id: string
          method: string
          notes: string | null
          payment_date: string
          reference: string | null
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          loan_id: string
          method?: string
          notes?: string | null
          payment_date?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          loan_id?: string
          method?: string
          notes?: string | null
          payment_date?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string | null
          loan_date: string
          loan_number: string
          notes: string | null
          outstanding_balance: number
          paid_at: string | null
          sale_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          loan_date?: string
          loan_number: string
          notes?: string | null
          outstanding_balance?: number
          paid_at?: string | null
          sale_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          total_cost?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          loan_date?: string
          loan_number?: string
          notes?: string | null
          outstanding_balance?: number
          paid_at?: string | null
          sale_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          business_id: string | null
          created_at: string
          data: Json
          deep_link: string | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          business_id?: string | null
          created_at?: string
          data?: Json
          deep_link?: string | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          business_id?: string | null
          created_at?: string
          data?: Json
          deep_link?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
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
      products: {
        Row: {
          bar_code: string | null
          base_price: number
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          item_type: string
          low_stock_threshold: number | null
          name: string
          selling_price: number
          sku: string | null
          stock_quantity: number
          unit: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          bar_code?: string | null
          base_price?: number
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          item_type?: string
          low_stock_threshold?: number | null
          name: string
          selling_price?: number
          sku?: string | null
          stock_quantity?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          bar_code?: string | null
          base_price?: number
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          item_type?: string
          low_stock_threshold?: number | null
          name?: string
          selling_price?: number
          sku?: string | null
          stock_quantity?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          auth_type: Database["public"]["Enums"]["auth_type"] | null
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          image_url: Json | null
          is_active: boolean
          is_deleted: boolean
          last_name: string | null
          notification_token: string | null
          onboarding_completed: boolean
          phone: string | null
          preferred_currency: string | null
          preferred_language: string
          updated_at: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          auth_type?: Database["public"]["Enums"]["auth_type"] | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          image_url?: Json | null
          is_active?: boolean
          is_deleted?: boolean
          last_name?: string | null
          notification_token?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          preferred_currency?: string | null
          preferred_language?: string
          updated_at?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          auth_type?: Database["public"]["Enums"]["auth_type"] | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          image_url?: Json | null
          is_active?: boolean
          is_deleted?: boolean
          last_name?: string | null
          notification_token?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          preferred_currency?: string | null
          preferred_language?: string
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
      quotation_items: {
        Row: {
          description: string
          discount: number
          id: string
          product_id: string | null
          quantity: number
          quotation_id: string
          total: number
          unit_price: number
        }
        Insert: {
          description: string
          discount?: number
          id?: string
          product_id?: string | null
          quantity?: number
          quotation_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          description?: string
          discount?: number
          id?: string
          product_id?: string | null
          quantity?: number
          quotation_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_views: {
        Row: {
          id: string
          ip_address: string | null
          quotation_id: string
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          quotation_id: string
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          quotation_id?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_views_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          accent_color: string | null
          business_id: string
          client_id: string
          created_at: string
          currency: string
          footer_note: string | null
          id: string
          issue_date: string
          notes: string | null
          quotation_number: string
          scope_of_work: string | null
          status: string
          subtotal: number
          tax: number
          tax_percentage: number
          template_id: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accent_color?: string | null
          business_id: string
          client_id: string
          created_at?: string
          currency?: string
          footer_note?: string | null
          id?: string
          issue_date: string
          notes?: string | null
          quotation_number: string
          scope_of_work?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_percentage?: number
          template_id?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accent_color?: string | null
          business_id?: string
          client_id?: string
          created_at?: string
          currency?: string
          footer_note?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          quotation_number?: string
          scope_of_work?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_percentage?: number
          template_id?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_item_returns: {
        Row: {
          authorized_by: string
          business_id: string
          created_at: string
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          sale_id: string
          sale_item_id: string
        }
        Insert: {
          authorized_by: string
          business_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          sale_id: string
          sale_item_id: string
        }
        Update: {
          authorized_by?: string
          business_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          sale_id?: string
          sale_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_item_returns_authorized_by_fkey"
            columns: ["authorized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_returns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_returns_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          base_price: number
          cost_total: number
          description: string
          discount: number
          id: string
          item_type: string
          product_id: string | null
          profit: number
          quantity: number
          returned_at: string | null
          returned_quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          base_price?: number
          cost_total?: number
          description: string
          discount?: number
          id?: string
          item_type?: string
          product_id?: string | null
          profit?: number
          quantity?: number
          returned_at?: string | null
          returned_quantity?: number
          sale_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          base_price?: number
          cost_total?: number
          description?: string
          discount?: number
          id?: string
          item_type?: string
          product_id?: string | null
          profit?: number
          quantity?: number
          returned_at?: string | null
          returned_quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_short_links: {
        Row: {
          created_at: string
          sale_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          sale_id: string
          slug: string
        }
        Update: {
          created_at?: string
          sale_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_short_links_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          loan_id: string | null
          notes: string | null
          profit: number
          recorded_at: string
          sale_date: string
          sale_number: string
          source: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          loan_id?: string | null
          notes?: string | null
          profit?: number
          recorded_at?: string
          sale_date?: string
          sale_number: string
          source?: string
          subtotal?: number
          tax?: number
          total?: number
          total_cost?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          loan_id?: string | null
          notes?: string | null
          profit?: number
          recorded_at?: string
          sale_date?: string
          sale_number?: string
          source?: string
          subtotal?: number
          tax?: number
          total?: number
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_categories: {
        Row: {
          business_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_system: boolean
          name: string
          permissions: Json
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          name: string
          permissions: Json
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          name?: string
          permissions?: Json
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      statistics: {
        Row: {
          created_at: string
          id: string
          total_6month_business_plan_subscribers: number
          total_6month_pro_plan_subscribers: number
          total_admins: number
          total_businesses: number
          total_free_plan_subscribers: number
          total_invoices_generated: number
          total_monthly_business_plan_subscribers: number
          total_monthly_pro_plan_subscribers: number
          total_quotations_generated: number
          total_revenue: number
          total_users: number
          total_yearly_business_plan_subscribers: number
          total_yearly_pro_plan_subscribers: number
        }
        Insert: {
          created_at?: string
          id?: string
          total_6month_business_plan_subscribers?: number
          total_6month_pro_plan_subscribers?: number
          total_admins?: number
          total_businesses?: number
          total_free_plan_subscribers?: number
          total_invoices_generated?: number
          total_monthly_business_plan_subscribers?: number
          total_monthly_pro_plan_subscribers?: number
          total_quotations_generated?: number
          total_revenue?: number
          total_users?: number
          total_yearly_business_plan_subscribers?: number
          total_yearly_pro_plan_subscribers?: number
        }
        Update: {
          created_at?: string
          id?: string
          total_6month_business_plan_subscribers?: number
          total_6month_pro_plan_subscribers?: number
          total_admins?: number
          total_businesses?: number
          total_free_plan_subscribers?: number
          total_invoices_generated?: number
          total_monthly_business_plan_subscribers?: number
          total_monthly_pro_plan_subscribers?: number
          total_quotations_generated?: number
          total_revenue?: number
          total_users?: number
          total_yearly_business_plan_subscribers?: number
          total_yearly_pro_plan_subscribers?: number
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          provider_reference: string | null
          raw_payload: Json | null
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          paid_at?: string | null
          provider_reference?: string | null
          raw_payload?: Json | null
          status?: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          provider_reference?: string | null
          raw_payload?: Json | null
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plan_features: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          limit_type: string
          limit_value: number | null
          subscription_plan_id: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          limit_type: string
          limit_value?: number | null
          subscription_plan_id: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          limit_type?: string
          limit_value?: number | null
          subscription_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plan_features_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_interval: string | null
          created_at: string
          description: string | null
          id: string
          is_contact_sales: boolean
          name: string
          plan_tier: string
          price_amount: number | null
          price_currency: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_interval?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_contact_sales?: boolean
          name: string
          plan_tier: string
          price_amount?: number | null
          price_currency?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_interval?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_contact_sales?: boolean
          name?: string
          plan_tier?: string
          price_amount?: number | null
          price_currency?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          end_date: string | null
          id: string
          plan: string
          start_date: string
          status: string
          subscription_plan_id: string | null
          user_id: string
        }
        Insert: {
          end_date?: string | null
          id?: string
          plan: string
          start_date?: string
          status?: string
          subscription_plan_id?: string | null
          user_id: string
        }
        Update: {
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string
          status?: string
          subscription_plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_quotation: { Args: { p_quotation_id: string }; Returns: boolean }
      accessible_business_ids: { Args: never; Returns: string[] }
      activate_pending_staff_membership: { Args: never; Returns: undefined }
      adjust_product_stock: {
        Args: {
          p_movement_type?: string
          p_product_id: string
          p_quantity_delta: number
          p_reason?: string
          p_unit_cost?: number
        }
        Returns: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_delta: number
          reason: string | null
          sale_id: string | null
          sale_item_id: string | null
          unit_cost: number | null
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_phone_available_for_account_linking: {
        Args: { phone_number: string }
        Returns: Json
      }
      check_plan_limit: {
        Args: { p_context?: Json; p_feature_key: string; p_user_id: string }
        Returns: undefined
      }
      check_subscription_expiry: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      clear_loan_to_sale: {
        Args: { p_loan_id: string; p_sale_date?: string }
        Returns: {
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          loan_id: string | null
          notes: string | null
          profit: number
          recorded_at: string
          sale_date: string
          sale_number: string
          source: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sales"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      convert_invoice_to_sale: {
        Args: { p_invoice_id: string; p_sale_date?: string }
        Returns: {
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          loan_id: string | null
          notes: string | null
          profit: number
          recorded_at: string
          sale_date: string
          sale_number: string
          source: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sales"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_business_for_account: {
        Args: {
          p_address?: string
          p_brand_color?: string
          p_capacity?: string
          p_context_business_id: string | null
          p_currency: string
          p_is_primary?: boolean
          p_logo_text?: string
          p_logo_url?: string
          p_name: string
          p_tax_number?: string
        }
        Returns: {
          address: string | null
          brand_color: string | null
          capacity: string | null
          created_at: string
          currency: string
          id: string
          is_primary: boolean
          logo_text: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          second_phone: string | null
          send_sale_alert: boolean
          tax_number: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "businesses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_direct_sale: {
        Args: {
          p_business_id: string
          p_client_id?: string
          p_currency?: string
          p_items?: Json
          p_notes?: string
          p_sale_date?: string
        }
        Returns: {
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          loan_id: string | null
          notes: string | null
          profit: number
          recorded_at: string
          sale_date: string
          sale_number: string
          source: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sales"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      return_sale_item: {
        Args: {
          p_notes?: string
          p_quantity: number
          p_sale_item_id: string
        }
        Returns: {
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          loan_id: string | null
          notes: string | null
          profit: number
          recorded_at: string
          sale_date: string
          sale_number: string
          source: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sales"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_direct_sale: {
        Args: {
          p_client_id?: string
          p_items?: Json
          p_notes?: string
          p_sale_date?: string
          p_sale_id: string
        }
        Returns: {
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          loan_id: string | null
          notes: string | null
          profit: number
          recorded_at: string
          sale_date: string
          sale_number: string
          source: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sales"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_invoice_from_loan: {
        Args: { p_due_date?: string; p_issue_date?: string; p_loan_id: string }
        Returns: {
          accent_color: string | null
          business_id: string
          client_id: string
          created_at: string
          currency: string
          due_date: string
          footer_note: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          payment_link: string | null
          quotation_id: string | null
          status: string
          subtotal: number
          tax: number
          tax_percentage: number
          template_id: string
          total: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_loan: {
        Args: {
          p_business_id: string
          p_client_id: string
          p_currency?: string
          p_items?: Json
          p_loan_date?: string
          p_notes?: string
        }
        Returns: {
          business_id: string
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string | null
          loan_date: string
          loan_number: string
          notes: string | null
          outstanding_balance: number
          paid_at: string | null
          sale_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "loans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_walk_in_client: {
        Args: { p_business_id: string }
        Returns: {
          address: string | null
          business_id: string
          created_at: string
          email: string | null
          id: string
          is_walk_in: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_stale_documents: { Args: never; Returns: undefined }
      find_staff_user_id_by_phone: {
        Args: { p_phone: string }
        Returns: string
      }
      get_business_owner_id: {
        Args: { p_business_id: string }
        Returns: string
      }
      get_effective_permissions: {
        Args: { p_business_id: string }
        Returns: Json
      }
      get_effective_subscription: {
        Args: { p_business_id?: string }
        Returns: {
          end_date: string
          plan_slug: string
        }[]
      }
      get_product_sales_performance: {
        Args: {
          p_business_id: string
          p_from_date?: string
          p_to_date?: string
        }
        Returns: {
          cogs: number
          is_orphan_line: boolean
          product_id: string
          product_name: string
          profit: number
          revenue: number
          sale_count: number
          sku: string
          units_sold: number
        }[]
      }
      get_user_by_phone: {
        Args: { phone_number: string }
        Returns: {
          id: string
          phone: string
        }[]
      }
      is_business_owner: { Args: { p_business_id: string }; Returns: boolean }
      next_invoice_number: { Args: { p_business_id: string }; Returns: string }
      next_loan_number: { Args: { p_business_id: string }; Returns: string }
      next_quotation_number: {
        Args: { p_business_id: string }
        Returns: string
      }
      next_sale_number: { Args: { p_business_id: string }; Returns: string }
      record_loan_payment: {
        Args: {
          p_amount: number
          p_loan_id: string
          p_method?: string
          p_notes?: string
          p_payment_date?: string
          p_reference?: string
        }
        Returns: {
          business_id: string
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string | null
          loan_date: string
          loan_number: string
          notes: string | null
          outstanding_balance: number
          paid_at: string | null
          sale_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          total_cost: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "loans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_subscription_activation_code: {
        Args: { p_code: string; p_plan_slug?: string }
        Returns: Json
      }
      remove_auto_created_owner_shell: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      repair_staff_account: { Args: { p_user_id: string }; Returns: undefined }
      require_business_permission: {
        Args: { p_action: string; p_business_id: string; p_resource: string }
        Returns: undefined
      }
      require_plan_feature: {
        Args: { p_feature_key: string; p_user_id: string }
        Returns: undefined
      }
      resolve_sale_short_link: { Args: { p_slug: string }; Returns: string }
      resolve_subscription_user_id: {
        Args: { p_business_id?: string; p_user_id: string }
        Returns: string
      }
      revoke_user_auth_sessions: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      set_confirmation: {
        Args: { code: string; phone_number: string }
        Returns: string
      }
      set_subscription_admin_secret: {
        Args: { p_secret: string }
        Returns: undefined
      }
      staff_can: {
        Args: { p_action: string; p_business_id: string; p_resource: string }
        Returns: boolean
      }
      staff_user_can_authenticate: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      sync_staff_profile_active: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      update_business_staff_status: {
        Args: { p_business_id: string; p_staff_id: string; p_status: string }
        Returns: {
          business_id: string
          id: string
          invited_at: string
          invited_by: string
          joined_at: string | null
          removed_at: string | null
          staff_category_id: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "business_staff"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_has_active_staff_membership: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "owner" | "staff"
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
      account_type: ["owner", "staff"],
      auth_type: ["Google", "Phone", "Email"],
      period_status: ["OPEN", "CLOSED"],
      sales_channel: ["CASH", "MOBILE", "BANK"],
      vat_status: ["VAT", "NON_VAT"],
    },
  },
} as const
