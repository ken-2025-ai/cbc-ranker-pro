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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          meeting_schedule: string | null
          name: string
          teacher_in_charge: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          meeting_schedule?: string | null
          name: string
          teacher_in_charge?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          meeting_schedule?: string | null
          name?: string
          teacher_in_charge?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      activity_participants: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          joined_date: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          joined_date?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          joined_date?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string
          description: string
          id: string
          ip_address: unknown | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          description: string
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
          description?: string
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_impersonation_sessions: {
        Row: {
          admin_id: string | null
          ended_at: string | null
          id: string
          institution_id: string | null
          is_active: boolean | null
          session_token: string
          started_at: string
        }
        Insert: {
          admin_id?: string | null
          ended_at?: string | null
          id?: string
          institution_id?: string | null
          is_active?: boolean | null
          session_token: string
          started_at?: string
        }
        Update: {
          admin_id?: string | null
          ended_at?: string | null
          id?: string
          institution_id?: string | null
          is_active?: boolean | null
          session_token?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_impersonation_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_impersonation_sessions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "admin_institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_institutions: {
        Row: {
          address: string | null
          county: string | null
          created_at: string
          email: string | null
          headteacher_name: string | null
          headteacher_phone: string | null
          id: string
          is_active: boolean | null
          is_blocked: boolean | null
          last_login: string | null
          name: string
          password_hash: string
          payment_reference: string | null
          phone: string | null
          registration_date: string
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          address?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          headteacher_name?: string | null
          headteacher_phone?: string | null
          id?: string
          is_active?: boolean | null
          is_blocked?: boolean | null
          last_login?: string | null
          name: string
          password_hash: string
          payment_reference?: string | null
          phone?: string | null
          registration_date?: string
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          address?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          headteacher_name?: string | null
          headteacher_phone?: string | null
          id?: string
          is_active?: boolean | null
          is_blocked?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string
          payment_reference?: string | null
          phone?: string | null
          registration_date?: string
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          delivery_method: string[] | null
          id: string
          is_sent: boolean | null
          message: string
          notification_type: string | null
          sent_at: string | null
          sent_by: string | null
          target_institutions: string[] | null
          target_type: string | null
          title: string
        }
        Insert: {
          created_at?: string
          delivery_method?: string[] | null
          id?: string
          is_sent?: boolean | null
          message: string
          notification_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
          target_institutions?: string[] | null
          target_type?: string | null
          title: string
        }
        Update: {
          created_at?: string
          delivery_method?: string[] | null
          id?: string
          is_sent?: boolean | null
          message?: string
          notification_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
          target_institutions?: string[] | null
          target_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_id: string | null
          created_at: string
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          failed_login_attempts: number | null
          full_name: string
          id: string
          is_active: boolean | null
          last_failed_login: string | null
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          failed_login_attempts?: number | null
          full_name: string
          id?: string
          is_active?: boolean | null
          last_failed_login?: string | null
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          failed_login_attempts?: number | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_failed_login?: string | null
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          institution_id: string
          priority: string | null
          status: string | null
          target_audience: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          institution_id: string
          priority?: string | null
          status?: string | null
          target_audience: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          institution_id?: string
          priority?: string | null
          status?: string | null
          target_audience?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      assessment_competencies: {
        Row: {
          assessment_id: string | null
          competency_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          assessment_id?: string | null
          competency_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          assessment_id?: string | null
          competency_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_competencies_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_type: string | null
          class_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          max_marks: number | null
          status: string | null
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assessment_type?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_marks?: number | null
          status?: string | null
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assessment_type?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_marks?: number | null
          status?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: string | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          institution_id: string
          status: string | null
          subject_id: string
          teacher_id: string
          title: string
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          assignment_type?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          institution_id: string
          status?: string | null
          subject_id: string
          teacher_id: string
          title: string
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          assignment_type?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          institution_id?: string
          status?: string | null
          subject_id?: string
          teacher_id?: string
          title?: string
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      classes: {
        Row: {
          academic_year: number | null
          capacity: number | null
          created_at: string
          grade: string
          id: string
          institution_id: string
          name: string
          stream: string | null
          teacher_id: string | null
        }
        Insert: {
          academic_year?: number | null
          capacity?: number | null
          created_at?: string
          grade: string
          id?: string
          institution_id: string
          name: string
          stream?: string | null
          teacher_id?: string | null
        }
        Update: {
          academic_year?: number | null
          capacity?: number | null
          created_at?: string
          grade?: string
          id?: string
          institution_id?: string
          name?: string
          stream?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          code: string
          created_at: string | null
          description: string
          id: string
          level: number
          strand: string
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description: string
          id?: string
          level: number
          strand: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string
          id?: string
          level?: number
          strand?: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competencies_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
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
      course_cluster_requirements: {
        Row: {
          alternative_clusters: Json | null
          cluster_points: number
          cluster_subjects: Json
          course_id: string
          created_at: string
          id: string
        }
        Insert: {
          alternative_clusters?: Json | null
          cluster_points: number
          cluster_subjects: Json
          course_id: string
          created_at?: string
          id?: string
        }
        Update: {
          alternative_clusters?: Json | null
          cluster_points?: number
          cluster_subjects?: Json
          course_id?: string
          created_at?: string
          id?: string
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
      disciplinary_records: {
        Row: {
          action_taken: string | null
          created_at: string
          description: string
          id: string
          incident_date: string
          incident_type: string
          parent_notified: boolean | null
          reported_by: string | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          description: string
          id?: string
          incident_date: string
          incident_type: string
          parent_notified?: boolean | null
          reported_by?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          description?: string
          id?: string
          incident_date?: string
          incident_type?: string
          parent_notified?: boolean | null
          reported_by?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      evidence: {
        Row: {
          assessment_id: string | null
          comments: string | null
          created_at: string | null
          evidence_type: string | null
          file_url: string | null
          id: string
          student_id: string | null
          uploaded_by: string
        }
        Insert: {
          assessment_id?: string | null
          comments?: string | null
          created_at?: string | null
          evidence_type?: string | null
          file_url?: string | null
          id?: string
          student_id?: string | null
          uploaded_by: string
        }
        Update: {
          assessment_id?: string | null
          comments?: string | null
          created_at?: string | null
          evidence_type?: string | null
          file_url?: string | null
          id?: string
          student_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      fees: {
        Row: {
          academic_year: number | null
          amount_due: number
          amount_paid: number | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          institution_id: string
          status: string | null
          student_id: string
          term: number
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          amount_due: number
          amount_paid?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          institution_id: string
          status?: string | null
          student_id: string
          term: number
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          amount_due?: number
          amount_paid?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          institution_id?: string
          status?: string | null
          student_id?: string
          term?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          comments: string | null
          competency_id: string | null
          evidence_id: string | null
          graded_at: string | null
          graded_by: string
          id: string
          mastery_level: string
          score: number
        }
        Insert: {
          comments?: string | null
          competency_id?: string | null
          evidence_id?: string | null
          graded_at?: string | null
          graded_by: string
          id?: string
          mastery_level: string
          score: number
        }
        Update: {
          comments?: string | null
          competency_id?: string | null
          evidence_id?: string | null
          graded_at?: string | null
          graded_by?: string
          id?: string
          mastery_level?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
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
      library_books: {
        Row: {
          author: string
          available_copies: number | null
          category: string
          created_at: string
          id: string
          isbn: string | null
          title: string
          total_copies: number | null
          updated_at: string
        }
        Insert: {
          author: string
          available_copies?: number | null
          category: string
          created_at?: string
          id?: string
          isbn?: string | null
          title: string
          total_copies?: number | null
          updated_at?: string
        }
        Update: {
          author?: string
          available_copies?: number | null
          category?: string
          created_at?: string
          id?: string
          isbn?: string | null
          title?: string
          total_copies?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      library_borrowings: {
        Row: {
          book_id: string
          borrowed_date: string
          created_at: string
          due_date: string
          fine_amount: number | null
          id: string
          returned_date: string | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          book_id: string
          borrowed_date?: string
          created_at?: string
          due_date: string
          fine_amount?: number | null
          id?: string
          returned_date?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          borrowed_date?: string
          created_at?: string
          due_date?: string
          fine_amount?: number | null
          id?: string
          returned_date?: string | null
          status?: string | null
          student_id?: string
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
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          institution_id: string
          parent_message_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          institution_id: string
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          institution_id?: string
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      parents_guardians: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary_contact: boolean | null
          occupation: string | null
          phone_number: string | null
          relationship: string
          student_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary_contact?: boolean | null
          occupation?: string | null
          phone_number?: string | null
          relationship: string
          student_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary_contact?: boolean | null
          occupation?: string | null
          phone_number?: string | null
          relationship?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
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
      payment_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          institution_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          recorded_by: string | null
          reference_number: string | null
          subscription_period_months: number | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          institution_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          subscription_period_months?: number | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          institution_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          subscription_period_months?: number | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "admin_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          fee_id: string
          id: string
          mpesa_receipt: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fee_id: string
          id?: string
          mpesa_receipt?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fee_id?: string
          id?: string
          mpesa_receipt?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          institution_id: string | null
          phone_number: string | null
          role: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          institution_id?: string | null
          phone_number?: string | null
          role?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          institution_id?: string | null
          phone_number?: string | null
          role?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_cost: number | null
          budget: number
          created_at: string
          description: string | null
          end_date: string | null
          estimated_cost: number
          id: string
          location: string
          materials: Json | null
          name: string
          start_date: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost?: number | null
          budget?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_cost?: number
          id?: string
          location: string
          materials?: Json | null
          name: string
          start_date: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cost?: number | null
          budget?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_cost?: number
          id?: string
          location?: string
          materials?: Json | null
          name?: string
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
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
      school_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          institution_id: string
          is_active: boolean | null
          location: string | null
          start_time: string | null
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type: string
          id?: string
          institution_id: string
          is_active?: boolean | null
          location?: string | null
          start_time?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          institution_id?: string
          is_active?: boolean | null
          location?: string | null
          start_time?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          department: string
          email: string | null
          employee_number: string
          full_name: string
          hire_date: string | null
          id: string
          institution_id: string
          phone: string | null
          position: string
          salary: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          email?: string | null
          employee_number: string
          full_name: string
          hire_date?: string | null
          id?: string
          institution_id: string
          phone?: string | null
          position: string
          salary?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string | null
          employee_number?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          institution_id?: string
          phone?: string | null
          position?: string
          salary?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_assignments: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          graded_at: string | null
          id: string
          marks_obtained: number | null
          status: string | null
          student_id: string
          submission_file: string | null
          submission_text: string | null
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          marks_obtained?: number | null
          status?: string | null
          student_id: string
          submission_file?: string | null
          submission_text?: string | null
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          marks_obtained?: number | null
          status?: string | null
          student_id?: string
          submission_file?: string | null
          submission_text?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          student_id: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          student_id: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          student_id?: string
        }
        Relationships: []
      }
      student_classes: {
        Row: {
          academic_year: number | null
          class_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          academic_year?: number | null
          class_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          academic_year?: number | null
          class_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_classes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_competency_progress: {
        Row: {
          assessment_count: number | null
          competency_id: string | null
          current_score: number | null
          id: string
          last_assessed: string | null
          mastery_status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_count?: number | null
          competency_id?: string | null
          current_score?: number | null
          id?: string
          last_assessed?: string | null
          mastery_status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_count?: number | null
          competency_id?: string | null
          current_score?: number | null
          id?: string
          last_assessed?: string | null
          mastery_status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_competency_progress_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competency_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_health_records: {
        Row: {
          allergies: string | null
          blood_group: string | null
          created_at: string
          doctor_name: string | null
          doctor_phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          insurance_details: string | null
          medical_conditions: string | null
          medications: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          blood_group?: string | null
          created_at?: string
          doctor_name?: string | null
          doctor_phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          insurance_details?: string | null
          medical_conditions?: string | null
          medications?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          blood_group?: string | null
          created_at?: string
          doctor_name?: string | null
          doctor_phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          insurance_details?: string | null
          medical_conditions?: string | null
          medications?: string | null
          student_id?: string
          updated_at?: string
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
          institution_id: string
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
          institution_id: string
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
          institution_id?: string
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
          institution_id: string | null
          level: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          institution_id?: string | null
          level: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          institution_id?: string | null
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
      teachers: {
        Row: {
          classes: string[] | null
          created_at: string
          department: string | null
          email: string | null
          employee_number: string
          full_name: string
          hire_date: string | null
          id: string
          institution_id: string
          phone: string | null
          qualification: string | null
          status: string | null
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          classes?: string[] | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number: string
          full_name: string
          hire_date?: string | null
          id?: string
          institution_id: string
          phone?: string | null
          qualification?: string | null
          status?: string | null
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          classes?: string[] | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          institution_id?: string
          phone?: string | null
          qualification?: string | null
          status?: string | null
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          academic_year: number | null
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          room: string | null
          start_time: string
          subject_id: string
          teacher_id: string | null
          term: number | null
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          room?: string | null
          start_time: string
          subject_id: string
          teacher_id?: string | null
          term?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          room?: string | null
          start_time?: string
          subject_id?: string
          teacher_id?: string | null
          term?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_kcse_results: {
        Row: {
          career_profile: Json | null
          cluster_points: number
          created_at: string
          id: string
          mean_grade: string
          recommended_courses: Json | null
          subjects: Json
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          career_profile?: Json | null
          cluster_points: number
          created_at?: string
          id?: string
          mean_grade: string
          recommended_courses?: Json | null
          subjects: Json
          total_points: number
          updated_at?: string
          user_id: string
        }
        Update: {
          career_profile?: Json | null
          cluster_points?: number
          created_at?: string
          id?: string
          mean_grade?: string
          recommended_courses?: Json | null
          subjects?: Json
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          notification_type: string
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          notification_type?: string
          priority?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      calculate_student_progress: {
        Args: { competency_uuid: string; student_uuid: string }
        Returns: undefined
      }
      create_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_ai_symptom_checker_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_result_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_institution_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: Json
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_institution_owner: {
        Args: { institution_uuid: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "teacher"
        | "student"
        | "parent"
        | "admin"
        | "principal"
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
      app_role: [
        "super_admin",
        "school_admin",
        "teacher",
        "student",
        "parent",
        "admin",
        "principal",
      ],
    },
  },
} as const
