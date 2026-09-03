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
      academy_assignments: {
        Row: {
          assigned_by: string | null
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_attempts: {
        Row: {
          answers: Json
          course_id: string
          created_at: string
          id: string
          passed: boolean
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          course_id: string
          created_at?: string
          id?: string
          passed?: boolean
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          course_id?: string
          created_at?: string
          id?: string
          passed?: boolean
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_courses: {
        Row: {
          category: string
          code: string
          created_at: string
          estimated_minutes: number
          id: string
          is_core: boolean
          is_published: boolean
          level: string
          pass_mark: number
          required_for: Database["public"]["Enums"]["app_role"] | null
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_core?: boolean
          is_published?: boolean
          level?: string
          pass_mark?: number
          required_for?: Database["public"]["Enums"]["app_role"] | null
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_core?: boolean
          is_published?: boolean
          level?: string
          pass_mark?: number
          required_for?: Database["public"]["Enums"]["app_role"] | null
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_lesson_progress: {
        Row: {
          completed_at: string
          course_id: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          body: string
          course_id: string
          created_at: string
          duration_minutes: number
          id: string
          key_points: string[]
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          course_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          key_points?: string[]
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          key_points?: string[]
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_questions: {
        Row: {
          correct_index: number
          course_id: string
          created_at: string
          explanation: string | null
          id: string
          options: string[]
          prompt: string
          sort_order: number
        }
        Insert: {
          correct_index?: number
          course_id: string
          created_at?: string
          explanation?: string | null
          id?: string
          options: string[]
          prompt: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          course_id?: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: string[]
          prompt?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_reminders: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          message: string
          read_at: string | null
          sent_by: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sent_by?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sent_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_reminders_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_plan: {
        Row: {
          approved_leave_days: number
          available_staff: number
          created_at: string
          department: string
          id: string
          projected_demand: number
          risk_level: string
          week_start: string
          zone_id: string | null
        }
        Insert: {
          approved_leave_days?: number
          available_staff?: number
          created_at?: string
          department?: string
          id?: string
          projected_demand?: number
          risk_level?: string
          week_start: string
          zone_id?: string | null
        }
        Update: {
          approved_leave_days?: number
          available_staff?: number
          created_at?: string
          department?: string
          id?: string
          projected_demand?: number
          risk_level?: string
          week_start?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capacity_plan_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_code: string
          client_id: string
          created_at: string
          expiry_date: string
          id: string
          issue_date: string
          pdf_url: string | null
          service_job_id: string
        }
        Insert: {
          certificate_code?: string
          client_id: string
          created_at?: string
          expiry_date?: string
          id?: string
          issue_date?: string
          pdf_url?: string | null
          service_job_id: string
        }
        Update: {
          certificate_code?: string
          client_id?: string
          created_at?: string
          expiry_date?: string
          id?: string
          issue_date?: string
          pdf_url?: string | null
          service_job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_service_job_id_fkey"
            columns: ["service_job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          cert_number: string
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string
          issuing_body: string
          user_id: string
        }
        Insert: {
          cert_number: string
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date: string
          issuing_body: string
          user_id: string
        }
        Update: {
          cert_number?: string
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          issuing_body?: string
          user_id?: string
        }
        Relationships: []
      }
      client_rep_handoffs: {
        Row: {
          client_id: string
          created_at: string
          from_rep_id: string | null
          handed_over_by: string | null
          id: string
          reason: string
          to_rep_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          from_rep_id?: string | null
          handed_over_by?: string | null
          id?: string
          reason: string
          to_rep_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          from_rep_id?: string | null
          handed_over_by?: string | null
          id?: string
          reason?: string
          to_rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_rep_handoffs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          change_reason: string | null
          client_id: string
          created_at: string
          id: string
          renewal_date: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          tier_id: string
          updated_at: string
        }
        Insert: {
          change_reason?: string | null
          client_id: string
          created_at?: string
          id?: string
          renewal_date?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier_id: string
          updated_at?: string
        }
        Update: {
          change_reason?: string | null
          client_id?: string
          created_at?: string
          id?: string
          renewal_date?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          assigned_rep_id: string | null
          change_reason: string | null
          client_code: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          onboarded_by: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_rep_id?: string | null
          change_reason?: string | null
          client_code?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          onboarded_by?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_rep_id?: string | null
          change_reason?: string | null
          client_code?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          onboarded_by?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          earned_on: string
          id: string
          invoice_id: string | null
          paid: boolean
          rep_id: string
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          earned_on?: string
          id?: string
          invoice_id?: string | null
          paid?: boolean
          rep_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          earned_on?: string
          id?: string
          invoice_id?: string | null
          paid?: boolean
          rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_snapshots: {
        Row: {
          created_at: string
          id: string
          payload: Json
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          snapshot_date: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          snapshot_date?: string
        }
        Relationships: []
      }
      employee_pay_overrides: {
        Row: {
          base_salary: number
          change_reason: string
          created_at: string
          created_by: string | null
          effective_date: string
          id: string
          user_id: string
        }
        Insert: {
          base_salary: number
          change_reason: string
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          user_id: string
        }
        Update: {
          base_salary?: number
          change_reason?: string
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_records: {
        Row: {
          change_reason: string | null
          contract_url: string | null
          created_at: string
          employment_status: Database["public"]["Enums"]["employment_status"]
          hire_date: string | null
          id: string
          id_document_url: string | null
          insurance_document_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          contract_url?: string | null
          created_at?: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          hire_date?: string | null
          id?: string
          id_document_url?: string | null
          insurance_document_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          change_reason?: string | null
          contract_url?: string | null
          created_at?: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          hire_date?: string | null
          id?: string
          id_document_url?: string | null
          insurance_document_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entity_events: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      extinguisher_units: {
        Row: {
          capacity_kg: number
          classification: string
          created_at: string
          hydrostatic_test_due: string | null
          id: string
          install_date: string | null
          last_service_date: string | null
          manufacture_date: string
          next_internal_maintenance_due: string | null
          next_service_due: string | null
          serial_number: string
          site_id: string
          status: Database["public"]["Enums"]["unit_status"]
          type: string
          updated_at: string
        }
        Insert: {
          capacity_kg?: number
          classification?: string
          created_at?: string
          hydrostatic_test_due?: string | null
          id?: string
          install_date?: string | null
          last_service_date?: string | null
          manufacture_date: string
          next_internal_maintenance_due?: string | null
          next_service_due?: string | null
          serial_number: string
          site_id: string
          status?: Database["public"]["Enums"]["unit_status"]
          type?: string
          updated_at?: string
        }
        Update: {
          capacity_kg?: number
          classification?: string
          created_at?: string
          hydrostatic_test_due?: string | null
          id?: string
          install_date?: string | null
          last_service_date?: string | null
          manufacture_date?: string
          next_internal_maintenance_due?: string | null
          next_service_due?: string | null
          serial_number?: string
          site_id?: string
          status?: Database["public"]["Enums"]["unit_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extinguisher_units_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["payment_method"]
          name: string
          opening_balance: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["payment_method"]
          name: string
          opening_balance?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_method"]
          name?: string
          opening_balance?: number
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          change_reason: string | null
          client_id: string | null
          counterparty_account_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          direction: Database["public"]["Enums"]["txn_direction"]
          id: string
          invoice_id: string | null
          payment_id: string | null
          service_job_id: string | null
          transfer_group_id: string | null
          txn_code: string
          txn_date: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category?: string
          change_reason?: string | null
          client_id?: string | null
          counterparty_account_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction: Database["public"]["Enums"]["txn_direction"]
          id?: string
          invoice_id?: string | null
          payment_id?: string | null
          service_job_id?: string | null
          transfer_group_id?: string | null
          txn_code?: string
          txn_date?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          change_reason?: string | null
          client_id?: string | null
          counterparty_account_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction?: Database["public"]["Enums"]["txn_direction"]
          id?: string
          invoice_id?: string | null
          payment_id?: string | null
          service_job_id?: string | null
          transfer_group_id?: string | null
          txn_code?: string
          txn_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_counterparty_account_id_fkey"
            columns: ["counterparty_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_service_job_id_fkey"
            columns: ["service_job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          on_hand_qty: number
          reorder_qty: number
          reorder_threshold: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          on_hand_qty?: number
          reorder_qty?: number
          reorder_threshold?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          on_hand_qty?: number
          reorder_qty?: number
          reorder_threshold?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoice_lines: {
        Row: {
          change_reason: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number | null
          quantity: number
          unit_price: number
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total?: number | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          change_reason: string | null
          client_id: string
          created_at: string
          due_date: string
          id: string
          invoice_code: string
          issue_date: string
          lead_id: string | null
          notes: string | null
          onboarded_by: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          change_reason?: string | null
          client_id: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_code?: string
          issue_date?: string
          lead_id?: string | null
          notes?: string | null
          onboarded_by?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          change_reason?: string | null
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_code?: string
          issue_date?: string
          lead_id?: string | null
          notes?: string | null
          onboarded_by?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
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
            foreignKeyName: "invoices_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_rep_id: string | null
          change_reason: string | null
          contact_name: string | null
          converted_client_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          estimated_tier_id: string | null
          id: string
          lead_code: string
          next_followup_date: string | null
          notes: string | null
          phone: string | null
          prospect_name: string
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_rep_id?: string | null
          change_reason?: string | null
          contact_name?: string | null
          converted_client_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_tier_id?: string | null
          id?: string
          lead_code?: string
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          prospect_name: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_rep_id?: string | null
          change_reason?: string | null
          contact_name?: string | null
          converted_client_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_tier_id?: string | null
          id?: string
          lead_code?: string
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          prospect_name?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_estimated_tier_id_fkey"
            columns: ["estimated_tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          entitlement_days: number
          id: string
          used_days: number
          user_id: string
          weekly_off_days: number
        }
        Insert: {
          entitlement_days?: number
          id?: string
          used_days?: number
          user_id: string
          weekly_off_days?: number
        }
        Update: {
          entitlement_days?: number
          id?: string
          used_days?: number
          user_id?: string
          weekly_off_days?: number
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          review_note: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          review_note?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          review_note?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pay_grades: {
        Row: {
          base_salary: number
          change_reason: string | null
          commission_per_client: number
          id: string
          label: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          base_salary: number
          change_reason?: string | null
          commission_per_client?: number
          id?: string
          label: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          base_salary?: number
          change_reason?: string | null
          commission_per_client?: number
          id?: string
          label?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_id: string | null
          amount: number
          change_reason: string | null
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          change_reason?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          change_reason?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          adjustments: number
          base_pay: number
          change_reason: string | null
          commissions_total: number
          created_at: string
          id: string
          notify_days_before: number
          pay_date: string
          period_month: string
          status: Database["public"]["Enums"]["payroll_status"]
          total_pay: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustments?: number
          base_pay?: number
          change_reason?: string | null
          commissions_total?: number
          created_at?: string
          id?: string
          notify_days_before?: number
          pay_date: string
          period_month: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_pay?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustments?: number
          base_pay?: number
          change_reason?: string | null
          commissions_total?: number
          created_at?: string
          id?: string
          notify_days_before?: number
          pay_date?: string
          period_month?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_pay?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      po_line_items: {
        Row: {
          id: string
          item_id: string
          line_total: number | null
          po_id: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          id?: string
          item_id: string
          line_total?: number | null
          po_id: string
          quantity?: number
          unit_cost?: number
        }
        Update: {
          id?: string
          item_id?: string
          line_total?: number | null
          po_id?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_line_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_line_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          deactivated_reason: string | null
          education: Json
          email: string | null
          emergency_contact: string | null
          full_name: string
          id: string
          is_active: boolean
          linkedin_url: string | null
          national_id: string | null
          off_days: string[]
          phone: string | null
          profile_completed_at: string | null
          requested_role: Database["public"]["Enums"]["app_role"] | null
          skills: string[]
          updated_at: string
          weekly_schedule: Json
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          deactivated_reason?: string | null
          education?: Json
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          linkedin_url?: string | null
          national_id?: string | null
          off_days?: string[]
          phone?: string | null
          profile_completed_at?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          skills?: string[]
          updated_at?: string
          weekly_schedule?: Json
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          deactivated_reason?: string | null
          education?: Json
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          linkedin_url?: string | null
          national_id?: string | null
          off_days?: string[]
          phone?: string | null
          profile_completed_at?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          skills?: string[]
          updated_at?: string
          weekly_schedule?: Json
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          change_reason: string | null
          created_at: string
          duty: number
          expected_date: string | null
          freight: number
          id: string
          order_date: string
          po_code: string
          status: Database["public"]["Enums"]["po_status"]
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          duty?: number
          expected_date?: string | null
          freight?: number
          id?: string
          order_date?: string
          po_code?: string
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          duty?: number
          expected_date?: string | null
          freight?: number
          id?: string
          order_date?: string
          po_code?: string
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      route_batches: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          scheduled_date: string
          technician_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scheduled_date: string
          technician_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          technician_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_batches_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      service_checklist_items: {
        Row: {
          completed: boolean
          confirmed_capacity_kg: number | null
          confirmed_classification: string | null
          confirmed_type: string | null
          created_at: string
          gauge_pressure_ok: boolean | null
          hose_nozzle_ok: boolean | null
          id: string
          job_id: string
          mounting_ok: boolean | null
          notes: string | null
          pin_present: boolean | null
          seal_intact: boolean | null
          spec_mismatch: boolean
          tag_attached: boolean | null
          unit_id: string
          updated_at: string
          weight_ok: boolean | null
        }
        Insert: {
          completed?: boolean
          confirmed_capacity_kg?: number | null
          confirmed_classification?: string | null
          confirmed_type?: string | null
          created_at?: string
          gauge_pressure_ok?: boolean | null
          hose_nozzle_ok?: boolean | null
          id?: string
          job_id: string
          mounting_ok?: boolean | null
          notes?: string | null
          pin_present?: boolean | null
          seal_intact?: boolean | null
          spec_mismatch?: boolean
          tag_attached?: boolean | null
          unit_id: string
          updated_at?: string
          weight_ok?: boolean | null
        }
        Update: {
          completed?: boolean
          confirmed_capacity_kg?: number | null
          confirmed_classification?: string | null
          confirmed_type?: string | null
          created_at?: string
          gauge_pressure_ok?: boolean | null
          hose_nozzle_ok?: boolean | null
          id?: string
          job_id?: string
          mounting_ok?: boolean | null
          notes?: string | null
          pin_present?: boolean | null
          seal_intact?: boolean | null
          spec_mismatch?: boolean
          tag_attached?: boolean | null
          unit_id?: string
          updated_at?: string
          weight_ok?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "service_checklist_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_checklist_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "extinguisher_units"
            referencedColumns: ["id"]
          },
        ]
      }
      service_jobs: {
        Row: {
          assigned_technician_id: string | null
          change_reason: string | null
          client_id: string
          comments: string | null
          completed_at: string | null
          created_at: string
          id: string
          job_code: string
          review_note: string | null
          review_status: Database["public"]["Enums"]["review_status"] | null
          reviewed_by: string | null
          route_batch_id: string | null
          scheduled_date: string
          site_id: string
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          visit_type: Database["public"]["Enums"]["visit_type"]
          zone_id: string | null
        }
        Insert: {
          assigned_technician_id?: string | null
          change_reason?: string | null
          client_id: string
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          job_code?: string
          review_note?: string | null
          review_status?: Database["public"]["Enums"]["review_status"] | null
          reviewed_by?: string | null
          route_batch_id?: string | null
          scheduled_date?: string
          site_id: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          zone_id?: string | null
        }
        Update: {
          assigned_technician_id?: string | null
          change_reason?: string | null
          client_id?: string
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          job_code?: string
          review_note?: string | null
          review_status?: Database["public"]["Enums"]["review_status"] | null
          reviewed_by?: string | null
          route_batch_id?: string | null
          scheduled_date?: string
          site_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_jobs_route_batch_id_fkey"
            columns: ["route_batch_id"]
            isOneToOne: false
            referencedRelation: "route_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_jobs_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      service_photos: {
        Row: {
          created_at: string
          id: string
          job_id: string
          phase: string
          unit_id: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          phase?: string
          unit_id?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          phase?: string
          unit_id?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_photos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "extinguisher_units"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reminders: {
        Row: {
          client_id: string
          created_at: string
          due_date: string
          id: string
          job_id: string | null
          last_service_date: string | null
          scheduled: boolean
          site_id: string
          tier_id: string | null
          zone_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          due_date: string
          id?: string
          job_id?: string | null
          last_service_date?: string | null
          scheduled?: boolean
          site_id: string
          tier_id?: string | null
          zone_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          job_id?: string | null
          last_service_date?: string | null
          scheduled?: boolean
          site_id?: string
          tier_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          client_id: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          placement_notes: string | null
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          client_id: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          placement_notes?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          client_id?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          placement_notes?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          direction: Database["public"]["Enums"]["txn_direction"]
          id: string
          item_id: string
          po_id: string | null
          quantity: number
          reason: string
          service_job_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          direction: Database["public"]["Enums"]["txn_direction"]
          id?: string
          item_id: string
          po_id?: string | null
          quantity: number
          reason?: string
          service_job_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["txn_direction"]
          id?: string
          item_id?: string
          po_id?: string | null
          quantity?: number
          reason?: string
          service_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_service_job_id_fkey"
            columns: ["service_job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          lead_time_days: number
          name: string
          notes: string | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          payment_terms: string | null
          phone: string | null
          source_links: Json
          updated_at: string
          website: string | null
        }
        Insert: {
          contact?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_time_days?: number
          name: string
          notes?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          payment_terms?: string | null
          phone?: string | null
          source_links?: Json
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_time_days?: number
          name?: string
          notes?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          payment_terms?: string | null
          phone?: string | null
          source_links?: Json
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      tiers: {
        Row: {
          annual_price: number
          certificate_type: string | null
          created_at: string
          free_refills: number
          id: string
          is_active: boolean
          response_sla_hours: number
          service_visits_per_year: number
          sort_order: number
          tier_name: string
          training_type: string | null
          unit_count_included: number
          unit_spec: string
          updated_at: string
        }
        Insert: {
          annual_price: number
          certificate_type?: string | null
          created_at?: string
          free_refills?: number
          id?: string
          is_active?: boolean
          response_sla_hours?: number
          service_visits_per_year?: number
          sort_order?: number
          tier_name: string
          training_type?: string | null
          unit_count_included?: number
          unit_spec?: string
          updated_at?: string
        }
        Update: {
          annual_price?: number
          certificate_type?: string | null
          created_at?: string
          free_refills?: number
          id?: string
          is_active?: boolean
          response_sla_hours?: number
          service_visits_per_year?: number
          sort_order?: number
          tier_name?: string
          training_type?: string | null
          unit_count_included?: number
          unit_spec?: string
          updated_at?: string
        }
        Relationships: []
      }
      todo_completions: {
        Row: {
          completed_at: string
          id: string
          todo_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          todo_key: string
          user_id?: string
        }
        Update: {
          completed_at?: string
          id?: string
          todo_key?: string
          user_id?: string
        }
        Relationships: []
      }
      training_completions: {
        Row: {
          completed_on: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          completed_on?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          completed_on?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          required_for: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          required_for?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          required_for?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          attendee_count: number
          client_id: string | null
          created_at: string
          engineer_id: string | null
          id: string
          is_standalone: boolean
          notes: string | null
          revenue: number
          session_date: string
          title: string
        }
        Insert: {
          attendee_count?: number
          client_id?: string | null
          created_at?: string
          engineer_id?: string | null
          id?: string
          is_standalone?: boolean
          notes?: string | null
          revenue?: number
          session_date?: string
          title: string
        }
        Update: {
          attendee_count?: number
          client_id?: string | null
          created_at?: string
          engineer_id?: string | null
          id?: string
          is_standalone?: boolean
          notes?: string | null
          revenue?: number
          session_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_checkins: {
        Row: {
          checked_in_at: string
          distance_from_expected: number | null
          id: string
          lat: number | null
          linked_record: string | null
          linked_table: string
          lng: number | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          distance_from_expected?: number | null
          id?: string
          lat?: number | null
          linked_record?: string | null
          linked_table: string
          lng?: number | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Update: {
          checked_in_at?: string
          distance_from_expected?: number | null
          id?: string
          lat?: number | null
          linked_record?: string | null
          linked_table?: string
          lng?: number | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      visit_logs: {
        Row: {
          client_id: string | null
          comments: string
          created_at: string
          id: string
          lead_id: string | null
          photos: string[]
          recommendation_reason: string | null
          recommended_tier_id: string | null
          rep_id: string
          visit_date: string
        }
        Insert: {
          client_id?: string | null
          comments?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          photos?: string[]
          recommendation_reason?: string | null
          recommended_tier_id?: string | null
          rep_id?: string
          visit_date?: string
        }
        Update: {
          client_id?: string | null
          comments?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          photos?: string[]
          recommendation_reason?: string | null
          recommended_tier_id?: string | null
          rep_id?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_logs_recommended_tier_id_fkey"
            columns: ["recommended_tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string
          district: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          district: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          district?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_inventory: { Args: never; Returns: boolean }
      can_view_finance: { Args: never; Returns: boolean }
      generate_service_reminders: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invoice_recalc: { Args: { _invoice: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      mark_commissions_paid: {
        Args: { _rep: string; _up_to: string }
        Returns: number
      }
      profile_completeness: { Args: { _user_id: string }; Returns: number }
      record_transfer: {
        Args: {
          _amount: number
          _category: string
          _from: string
          _note: string
          _to: string
        }
        Returns: string
      }
      rep_unpaid_commission: { Args: { _rep: string }; Returns: number }
      schedule_service_job: {
        Args: {
          _client_id: string
          _visit_type: Database["public"]["Enums"]["visit_type"]
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "sales_rep" | "technician" | "finance"
      approval_status: "Pending" | "Approved" | "Denied"
      client_status: "Active" | "Prospect" | "Suspended" | "Churned"
      employment_status: "Onboarding" | "Active" | "Suspended" | "Terminated"
      invoice_status: "Draft" | "Sent" | "PartiallyPaid" | "Paid" | "Overdue"
      job_status: "Scheduled" | "In Progress" | "Completed" | "Missed"
      lead_stage: "New" | "Contacted" | "Negotiation" | "Won" | "Lost"
      leave_type: "Weekly Off" | "Paid Leave" | "Sick"
      partner_type: "Supplier" | "Shipping" | "TaxAgent"
      payment_method: "Cash" | "MobileMoney" | "Bank"
      payroll_status: "Draft" | "Approved" | "Paid"
      po_status: "Draft" | "Ordered" | "In Transit" | "Received"
      review_status: "Pending Review" | "Approved" | "Flagged"
      subscription_status: "Active" | "Lapsed" | "Cancelled"
      txn_direction: "In" | "Out"
      unit_status: "In Service" | "Due" | "Overdue" | "Retired"
      visit_type: "Service" | "Refill" | "Service+Refill" | "Replacement"
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
      app_role: ["admin", "manager", "sales_rep", "technician", "finance"],
      approval_status: ["Pending", "Approved", "Denied"],
      client_status: ["Active", "Prospect", "Suspended", "Churned"],
      employment_status: ["Onboarding", "Active", "Suspended", "Terminated"],
      invoice_status: ["Draft", "Sent", "PartiallyPaid", "Paid", "Overdue"],
      job_status: ["Scheduled", "In Progress", "Completed", "Missed"],
      lead_stage: ["New", "Contacted", "Negotiation", "Won", "Lost"],
      leave_type: ["Weekly Off", "Paid Leave", "Sick"],
      partner_type: ["Supplier", "Shipping", "TaxAgent"],
      payment_method: ["Cash", "MobileMoney", "Bank"],
      payroll_status: ["Draft", "Approved", "Paid"],
      po_status: ["Draft", "Ordered", "In Transit", "Received"],
      review_status: ["Pending Review", "Approved", "Flagged"],
      subscription_status: ["Active", "Lapsed", "Cancelled"],
      txn_direction: ["In", "Out"],
      unit_status: ["In Service", "Due", "Overdue", "Retired"],
      visit_type: ["Service", "Refill", "Service+Refill", "Replacement"],
    },
  },
} as const
