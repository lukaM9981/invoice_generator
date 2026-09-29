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
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          vat_id: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          vat_id?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vat_id?: string | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number | null
          position: number
          quantity: number
          unit_price: number
          unit_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          line_total?: number | null
          position: number
          quantity?: number
          unit_price?: number
          unit_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number | null
          position?: number
          quantity?: number
          unit_price?: number
          unit_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_fk"
            columns: ["invoice_id", "user_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      invoice_number_sequences: {
        Row: {
          last_number: number
          user_id: string
          year: number
        }
        Insert: {
          last_number?: number
          user_id: string
          year: number
        }
        Update: {
          last_number?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      invoice_pdfs: {
        Row: {
          byte_size: number | null
          created_at: string
          id: string
          invoice_id: string
          storage_path: string
          user_id: string
          version: number
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          id?: string
          invoice_id: string
          storage_path: string
          user_id: string
          version: number
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          id?: string
          invoice_id?: string
          storage_path?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_pdfs_invoice_fk"
            columns: ["invoice_id", "user_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      invoice_sends: {
        Row: {
          body: string
          created_at: string
          error_message: string | null
          id: string
          invoice_id: string
          payment_link_url: string | null
          pdf_id: string | null
          provider_message_id: string | null
          status: string
          subject: string
          to_email: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id: string
          payment_link_url?: string | null
          pdf_id?: string | null
          provider_message_id?: string | null
          status: string
          subject: string
          to_email: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string
          payment_link_url?: string | null
          pdf_id?: string | null
          provider_message_id?: string | null
          status?: string
          subject?: string
          to_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sends_invoice_fk"
            columns: ["invoice_id", "user_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "invoice_sends_pdf_id_fkey"
            columns: ["pdf_id"]
            isOneToOne: false
            referencedRelation: "invoice_pdfs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_company_name: string | null
          client_email: string | null
          client_full_name: string | null
          client_id: string | null
          client_vat_id: string | null
          comments: string | null
          content_version: number
          created_at: string
          currency: string
          due_date: string
          finalized_at: string | null
          first_sent_at: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          last_sent_at: string | null
          number_sequence: number | null
          number_year: number | null
          paid_at: string | null
          paid_source: string | null
          payment_status: string
          send_count: number
          sender_address: string | null
          sender_company_name: string | null
          sender_email: string | null
          sender_full_name: string | null
          sender_vat_id: string | null
          sender_website: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_link_id: string | null
          stripe_payment_link_url: string | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_company_name?: string | null
          client_email?: string | null
          client_full_name?: string | null
          client_id?: string | null
          client_vat_id?: string | null
          comments?: string | null
          content_version?: number
          created_at?: string
          currency?: string
          due_date?: string
          finalized_at?: string | null
          first_sent_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          last_sent_at?: string | null
          number_sequence?: number | null
          number_year?: number | null
          paid_at?: string | null
          paid_source?: string | null
          payment_status?: string
          send_count?: number
          sender_address?: string | null
          sender_company_name?: string | null
          sender_email?: string | null
          sender_full_name?: string | null
          sender_vat_id?: string | null
          sender_website?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_address?: string | null
          client_company_name?: string | null
          client_email?: string | null
          client_full_name?: string | null
          client_id?: string | null
          client_vat_id?: string | null
          comments?: string | null
          content_version?: number
          created_at?: string
          currency?: string
          due_date?: string
          finalized_at?: string | null
          first_sent_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          last_sent_at?: string | null
          number_sequence?: number | null
          number_year?: number | null
          paid_at?: string | null
          paid_source?: string | null
          payment_status?: string
          send_count?: number
          sender_address?: string | null
          sender_company_name?: string | null
          sender_email?: string | null
          sender_full_name?: string | null
          sender_vat_id?: string | null
          sender_website?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          default_email_body: string | null
          default_email_subject: string | null
          email: string | null
          full_name: string | null
          id: string
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          stripe_details_submitted: boolean
          updated_at: string
          vat_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          default_email_body?: string | null
          default_email_subject?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_details_submitted?: boolean
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          default_email_body?: string | null
          default_email_subject?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_details_submitted?: boolean
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          account_id: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          received_at: string
          type: string
        }
        Insert: {
          account_id?: string | null
          id: string
          payload?: Json | null
          processed_at?: string | null
          received_at?: string
          type: string
        }
        Update: {
          account_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finalize_invoice: {
        Args: { p_invoice_id: string }
        Returns: {
          client_address: string | null
          client_company_name: string | null
          client_email: string | null
          client_full_name: string | null
          client_id: string | null
          client_vat_id: string | null
          comments: string | null
          content_version: number
          created_at: string
          currency: string
          due_date: string
          finalized_at: string | null
          first_sent_at: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          last_sent_at: string | null
          number_sequence: number | null
          number_year: number | null
          paid_at: string | null
          paid_source: string | null
          payment_status: string
          send_count: number
          sender_address: string | null
          sender_company_name: string | null
          sender_email: string | null
          sender_full_name: string | null
          sender_vat_id: string | null
          sender_website: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_link_id: string | null
          stripe_payment_link_url: string | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      recalculate_invoice_totals: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
