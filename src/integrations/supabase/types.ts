export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_requests: {
        Row: {
          appointment_type: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone_number: string
          preferred_date: string
          preferred_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          appointment_type: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone_number: string
          preferred_date: string
          preferred_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          appointment_type?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone_number?: string
          preferred_date?: string
          preferred_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      breeding_alerts: {
        Row: {
          breeding_date: string | null
          created_at: string
          expected_delivery: string | null
          id: string
          livestock_id: string | null
          notes: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          breeding_date?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          livestock_id?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          breeding_date?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          livestock_id?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeding_alerts_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean | null
        }
        Relationships: []
      }
      crop_schedules: {
        Row: {
          activity_type: string
          completed: boolean | null
          completed_date: string | null
          created_at: string
          crop_id: string | null
          fertilizer_type: string | null
          id: string
          notes: string | null
          scheduled_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string
          crop_id?: string | null
          fertilizer_type?: string | null
          id?: string
          notes?: string | null
          scheduled_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string
          crop_id?: string | null
          fertilizer_type?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_schedules_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          created_at: string
          crop_type: string
          farm_name: string | null
          harvesting_date: string | null
          id: string
          location: string | null
          planting_date: string
          size_hectares: number | null
          status: string | null
          storage_plan: string | null
          updated_at: string
          user_id: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop_type: string
          farm_name?: string | null
          harvesting_date?: string | null
          id?: string
          location?: string | null
          planting_date: string
          size_hectares?: number | null
          status?: string | null
          storage_plan?: string | null
          updated_at?: string
          user_id: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop_type?: string
          farm_name?: string | null
          harvesting_date?: string | null
          id?: string
          location?: string | null
          planting_date?: string
          size_hectares?: number | null
          status?: string | null
          storage_plan?: string | null
          updated_at?: string
          user_id?: string
          variety?: string | null
        }
        Relationships: []
      }
      exam_periods: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          institution_id: string
          name: string
          start_date: string | null
          term: number
          year: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          institution_id: string
          name: string
          start_date?: string | null
          term: number
          year?: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          institution_id?: string
          name?: string
          start_date?: string | null
          term?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_periods_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          category: string
          created_at: string
          id: string
          question: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          category: string
          created_at?: string
          id?: string
          question: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          category?: string
          created_at?: string
          id?: string
          question?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_schedules: {
        Row: {
          created_at: string
          feed_type: string
          feeding_time: string
          frequency: string
          id: string
          livestock_id: string | null
          notes: string | null
          quantity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_type: string
          feeding_time: string
          frequency: string
          id?: string
          livestock_id?: string | null
          notes?: string | null
          quantity: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feed_type?: string
          feeding_time?: string
          frequency?: string
          id?: string
          livestock_id?: string | null
          notes?: string | null
          quantity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_schedules_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_users: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_users_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          code: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      livestock: {
        Row: {
          age_months: number | null
          breed: string | null
          created_at: string
          gender: string | null
          health_status: string | null
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_months?: number | null
          breed?: string | null
          created_at?: string
          gender?: string | null
          health_status?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_months?: number | null
          breed?: string | null
          created_at?: string
          gender?: string | null
          health_status?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marks: {
        Row: {
          exam_period_id: string
          grade: string | null
          id: string
          remarks: string | null
          score: number
          student_id: string
          subject_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          exam_period_id: string
          grade?: string | null
          id?: string
          remarks?: string | null
          score: number
          student_id: string
          subject_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          exam_period_id?: string
          grade?: string | null
          id?: string
          remarks?: string | null
          score?: number
          student_id?: string
          subject_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_exam_period_id_fkey"
            columns: ["exam_period_id"]
            isOneToOne: false
            referencedRelation: "exam_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          admission_date: string
          assigned_doctor: string
          created_at: string
          created_by: string | null
          current_conditions: string | null
          date_of_birth: string | null
          department: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          id: string
          medical_history: string | null
          phone_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_date?: string
          assigned_doctor: string
          created_at?: string
          created_by?: string | null
          current_conditions?: string | null
          date_of_birth?: string | null
          department: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_date?: string
          assigned_doctor?: string
          created_at?: string
          created_by?: string | null
          current_conditions?: string | null
          date_of_birth?: string | null
          department?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      saved_results: {
        Row: {
          career_profile: Json | null
          career_recommendations: string[] | null
          cluster_points: number | null
          created_at: string
          email: string | null
          id: string
          mean_grade: string
          phone_number: string | null
          recommended_courses: Json
          result_code: string
          student_name: string | null
          subjects: Json
          total_points: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          career_profile?: Json | null
          career_recommendations?: string[] | null
          cluster_points?: number | null
          created_at?: string
          email?: string | null
          id?: string
          mean_grade: string
          phone_number?: string | null
          recommended_courses: Json
          result_code: string
          student_name?: string | null
          subjects: Json
          total_points: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          career_profile?: Json | null
          career_recommendations?: string[] | null
          cluster_points?: number | null
          created_at?: string
          email?: string | null
          id?: string
          mean_grade?: string
          phone_number?: string | null
          recommended_courses?: Json
          result_code?: string
          student_name?: string | null
          subjects?: Json
          total_points?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          admission_number: string
          created_at: string
          full_name: string
          grade: string
          id: string
          institution_id: string | null
          stream: string | null
          updated_at: string
          year: number
        }
        Insert: {
          admission_number: string
          created_at?: string
          full_name: string
          grade: string
          id?: string
          institution_id?: string | null
          stream?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          admission_number?: string
          created_at?: string
          full_name?: string
          grade?: string
          id?: string
          institution_id?: string | null
          stream?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "students_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: string
          level: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          level: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          level?: string
          name?: string
        }
        Relationships: []
      }
      table_name: {
        Row: {
          data: Json | null
          id: number
          inserted_at: string
          name: string | null
          updated_at: string
        }
        Insert: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          administered_date: string | null
          created_at: string
          id: string
          livestock_id: string | null
          notes: string | null
          scheduled_date: string
          status: string | null
          updated_at: string
          user_id: string
          vaccine_name: string
        }
        Insert: {
          administered_date?: string | null
          created_at?: string
          id?: string
          livestock_id?: string | null
          notes?: string | null
          scheduled_date: string
          status?: string | null
          updated_at?: string
          user_id: string
          vaccine_name: string
        }
        Update: {
          administered_date?: string | null
          created_at?: string
          id?: string
          livestock_id?: string | null
          notes?: string | null
          scheduled_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_result_code: {
        Args: Record<PropertyKey, never>
        Returns: string
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
    Enums: {},
  },
} as const
