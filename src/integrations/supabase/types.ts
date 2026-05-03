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
      anamnesis: {
        Row: {
          allergies: string | null
          chief_complaint: string | null
          chronic_conditions: string | null
          created_at: string
          family_history: string | null
          habits: string | null
          hda: string | null
          id: string
          medications: string | null
          owner_id: string
          past_history: string | null
          record_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          chief_complaint?: string | null
          chronic_conditions?: string | null
          created_at?: string
          family_history?: string | null
          habits?: string | null
          hda?: string | null
          id?: string
          medications?: string | null
          owner_id?: string
          past_history?: string | null
          record_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          chief_complaint?: string | null
          chronic_conditions?: string | null
          created_at?: string
          family_history?: string | null
          habits?: string | null
          hda?: string | null
          id?: string
          medications?: string | null
          owner_id?: string
          past_history?: string | null
          record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          owner_id: string
          patient_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          owner_id?: string
          patient_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          owner_id?: string
          patient_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          patient_id: string | null
          record_id: string | null
          section: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          patient_id?: string | null
          record_id?: string | null
          section: string
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          patient_id?: string | null
          record_id?: string | null
          section?: string
          user_id?: string
        }
        Relationships: []
      }
      clinical_documents: {
        Row: {
          category: string
          content: string
          created_at: string
          doc_type: string
          id: string
          issued_at: string
          owner_id: string
          record_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content?: string
          created_at?: string
          doc_type: string
          id?: string
          issued_at?: string
          owner_id?: string
          record_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          doc_type?: string
          id?: string
          issued_at?: string
          owner_id?: string
          record_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinical_evolution: {
        Row: {
          created_at: string
          id: string
          note: string
          noted_at: string
          owner_id: string
          professional: string | null
          record_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          noted_at?: string
          owner_id?: string
          professional?: string | null
          record_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          noted_at?: string
          owner_id?: string
          professional?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_evolution_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_exams: {
        Row: {
          blood_pressure: string | null
          created_at: string
          dental_chart: Json | null
          exam_date: string
          heart_rate: number | null
          height: number | null
          id: string
          observations: string | null
          owner_id: string
          record_id: string
          spo2: number | null
          temperature: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          blood_pressure?: string | null
          created_at?: string
          dental_chart?: Json | null
          exam_date?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          observations?: string | null
          owner_id?: string
          record_id: string
          spo2?: number | null
          temperature?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          blood_pressure?: string | null
          created_at?: string
          dental_chart?: Json | null
          exam_date?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          observations?: string | null
          owner_id?: string
          record_id?: string
          spo2?: number | null
          temperature?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_exams_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          cid_code: string | null
          created_at: string
          id: string
          owner_id: string
          primary_diagnosis: string
          record_id: string
          risk: Database["public"]["Enums"]["risk_level"] | null
          secondary_diagnoses: Json | null
          updated_at: string
        }
        Insert: {
          cid_code?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          primary_diagnosis: string
          record_id: string
          risk?: Database["public"]["Enums"]["risk_level"] | null
          secondary_diagnoses?: Json | null
          updated_at?: string
        }
        Update: {
          cid_code?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          primary_diagnosis?: string
          record_id?: string
          risk?: Database["public"]["Enums"]["risk_level"] | null
          secondary_diagnoses?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_requests: {
        Row: {
          created_at: string
          exam_name: string
          id: string
          interpretation: string | null
          owner_id: string
          record_id: string
          requested_at: string
          result_filename: string | null
          result_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_name: string
          id?: string
          interpretation?: string | null
          owner_id?: string
          record_id: string
          requested_at?: string
          result_filename?: string | null
          result_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_name?: string
          id?: string
          interpretation?: string | null
          owner_id?: string
          record_id?: string
          requested_at?: string
          result_filename?: string | null
          result_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_requests_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_plans: {
        Row: {
          created_at: string
          duration_weeks: number | null
          exercises: Json
          frequency: string | null
          id: string
          notes: string | null
          owner_id: string
          record_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number | null
          exercises?: Json
          frequency?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          record_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number | null
          exercises?: Json
          frequency?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          record_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          id: string
          invoice_url: string | null
          notes: string | null
          owner_id: string
          spent_at: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description: string
          id?: string
          invoice_url?: string | null
          notes?: string | null
          owner_id?: string
          spent_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string
          id?: string
          invoice_url?: string | null
          notes?: string | null
          owner_id?: string
          spent_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          min_quantity: number
          name: string
          notes: string | null
          owner_id: string
          quantity: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          notes?: string | null
          owner_id?: string
          quantity?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          notes?: string | null
          owner_id?: string
          quantity?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          moved_at: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          owner_id: string
          quantity: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          moved_at?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          owner_id?: string
          quantity: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          moved_at?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          owner_id?: string
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          patient_id: string
          record_type: Database["public"]["Enums"]["record_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string
          patient_id: string
          record_type?: Database["public"]["Enums"]["record_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          patient_id?: string
          record_type?: Database["public"]["Enums"]["record_type"]
          updated_at?: string
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          created_at: string
          guidelines: string | null
          id: string
          meals: Json
          owner_id: string
          record_id: string
          title: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          guidelines?: string | null
          id?: string
          meals?: Json
          owner_id?: string
          record_id: string
          title?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          guidelines?: string | null
          id?: string
          meals?: Json
          owner_id?: string
          record_id?: string
          title?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          gender: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          gender?: string | null
          id?: string
          name: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          gender?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          owner_id: string
          paid_at: string
          patient_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          paid_at?: string
          patient_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          paid_at?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medication: string
          owner_id: string
          prescription_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication: string
          owner_id?: string
          prescription_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication?: string
          owner_id?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          prescribed_at: string
          professional: string | null
          professional_registry: string | null
          record_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          prescribed_at?: string
          professional?: string | null
          professional_registry?: string | null
          record_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          prescribed_at?: string
          professional?: string | null
          professional_registry?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_assessments: {
        Row: {
          assessed_at: string
          category: string
          created_at: string
          data: Json
          id: string
          notes: string | null
          owner_id: string
          record_id: string
          updated_at: string
        }
        Insert: {
          assessed_at?: string
          category: string
          created_at?: string
          data?: Json
          id?: string
          notes?: string | null
          owner_id?: string
          record_id: string
          updated_at?: string
        }
        Update: {
          assessed_at?: string
          category?: string
          created_at?: string
          data?: Json
          id?: string
          notes?: string | null
          owner_id?: string
          record_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clinic_logo_url: string | null
          clinic_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          notify_email: string | null
          professional_category: string | null
          professional_registry: string | null
          professional_uf: string | null
          updated_at: string
        }
        Insert: {
          clinic_logo_url?: string | null
          clinic_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          notify_email?: string | null
          professional_category?: string | null
          professional_registry?: string | null
          professional_uf?: string | null
          updated_at?: string
        }
        Update: {
          clinic_logo_url?: string | null
          clinic_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notify_email?: string | null
          professional_category?: string | null
          professional_registry?: string | null
          professional_uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      record_attachments: {
        Row: {
          category: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          owner_id: string
          record_id: string
          uploaded_at: string
        }
        Insert: {
          category?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          owner_id?: string
          record_id: string
          uploaded_at?: string
        }
        Update: {
          category?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          owner_id?: string
          record_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_attachments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_requests: {
        Row: {
          clinic_logo_url: string | null
          clinic_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          password_hash: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["signup_status"]
        }
        Insert: {
          clinic_logo_url?: string | null
          clinic_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          password_hash: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["signup_status"]
        }
        Update: {
          clinic_logo_url?: string | null
          clinic_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["signup_status"]
        }
        Relationships: []
      }
      therapeutic_plans: {
        Row: {
          care_plan: string | null
          created_at: string
          frequency: string | null
          id: string
          interventions: string | null
          objectives: string | null
          owner_id: string
          professionals: string | null
          record_id: string
          updated_at: string
        }
        Insert: {
          care_plan?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          interventions?: string | null
          objectives?: string | null
          owner_id?: string
          professionals?: string | null
          record_id: string
          updated_at?: string
        }
        Update: {
          care_plan?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          interventions?: string | null
          objectives?: string | null
          owner_id?: string
          professionals?: string | null
          record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapeutic_plans_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          performed_at: string
          procedure: string
          professional: string | null
          record_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          performed_at?: string
          procedure: string
          professional?: string | null
          record_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          performed_at?: string
          procedure?: string
          professional?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      appointment_status: "scheduled" | "attended" | "missed" | "cancelled"
      expense_category:
        | "materials"
        | "cleaning"
        | "salaries"
        | "rent"
        | "utilities"
        | "other"
      movement_type: "in" | "out"
      payment_method: "credit_card" | "debit_card" | "pix" | "cash"
      record_type: "medical" | "dental"
      risk_level: "low" | "medium" | "high"
      signup_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      appointment_status: ["scheduled", "attended", "missed", "cancelled"],
      expense_category: [
        "materials",
        "cleaning",
        "salaries",
        "rent",
        "utilities",
        "other",
      ],
      movement_type: ["in", "out"],
      payment_method: ["credit_card", "debit_card", "pix", "cash"],
      record_type: ["medical", "dental"],
      risk_level: ["low", "medium", "high"],
      signup_status: ["pending", "approved", "rejected"],
    },
  },
} as const
