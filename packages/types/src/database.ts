export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      account_restrictions: {
        Row: {
          id: string;
          issued_at: string;
          issued_by: string;
          lifted_at: string | null;
          lifted_by: string | null;
          reason: string;
          restriction_type: Database["public"]["Enums"]["account_restriction_type"];
          user_id: string;
        };
        Insert: {
          id?: string;
          issued_at?: string;
          issued_by: string;
          lifted_at?: string | null;
          lifted_by?: string | null;
          reason: string;
          restriction_type: Database["public"]["Enums"]["account_restriction_type"];
          user_id: string;
        };
        Update: {
          id?: string;
          issued_at?: string;
          issued_by?: string;
          lifted_at?: string | null;
          lifted_by?: string | null;
          reason?: string;
          restriction_type?: Database["public"]["Enums"]["account_restriction_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_restrictions_issued_by_fkey";
            columns: ["issued_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_restrictions_lifted_by_fkey";
            columns: ["lifted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_restrictions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      achievements: {
        Row: {
          created_at: string;
          description_bn: string | null;
          description_en: string | null;
          id: string;
          label_bn: string;
          label_en: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description_bn?: string | null;
          description_en?: string | null;
          id?: string;
          label_bn: string;
          label_en: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description_bn?: string | null;
          description_en?: string | null;
          id?: string;
          label_bn?: string;
          label_en?: string;
          slug?: string;
        };
        Relationships: [];
      };
      alert_escalation_steps: {
        Row: {
          after_minutes: number;
          radius_km: number;
          step: number;
          urgency: Database["public"]["Enums"]["urgency_level"];
        };
        Insert: {
          after_minutes: number;
          radius_km: number;
          step: number;
          urgency: Database["public"]["Enums"]["urgency_level"];
        };
        Update: {
          after_minutes?: number;
          radius_km?: number;
          step?: number;
          urgency?: Database["public"]["Enums"]["urgency_level"];
        };
        Relationships: [];
      };
      animal_types: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          label_bn: string;
          label_en: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label_bn: string;
          label_en: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label_bn?: string;
          label_en?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: string;
          new_value: Json | null;
          previous_value: Json | null;
          reason: string | null;
          target_id: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          new_value?: Json | null;
          previous_value?: Json | null;
          reason?: string | null;
          target_id?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          new_value?: Json | null;
          previous_value?: Json | null;
          reason?: string | null;
          target_id?: string | null;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_comments: {
        Row: {
          author_id: string;
          body: string;
          case_id: string;
          created_at: string;
          edited_at: string | null;
          id: string;
          is_hidden: boolean;
        };
        Insert: {
          author_id: string;
          body: string;
          case_id: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          is_hidden?: boolean;
        };
        Update: {
          author_id?: string;
          body?: string;
          case_id?: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          is_hidden?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "case_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_comments_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
        ];
      };
      case_needs: {
        Row: {
          case_id: string;
          created_at: string;
          fulfilled_by_response_id: string | null;
          id: string;
          is_fulfilled: boolean;
          need_type: Database["public"]["Enums"]["assistance_type"];
        };
        Insert: {
          case_id: string;
          created_at?: string;
          fulfilled_by_response_id?: string | null;
          id?: string;
          is_fulfilled?: boolean;
          need_type: Database["public"]["Enums"]["assistance_type"];
        };
        Update: {
          case_id?: string;
          created_at?: string;
          fulfilled_by_response_id?: string | null;
          id?: string;
          is_fulfilled?: boolean;
          need_type?: Database["public"]["Enums"]["assistance_type"];
        };
        Relationships: [
          {
            foreignKeyName: "case_needs_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_needs_fulfilled_by_response_id_fkey";
            columns: ["fulfilled_by_response_id"];
            isOneToOne: false;
            referencedRelation: "case_responses";
            referencedColumns: ["id"];
          },
        ];
      };
      case_responses: {
        Row: {
          assistance_types: Database["public"]["Enums"]["assistance_type"][];
          availability_note: string | null;
          case_id: string;
          confirmed_by: string | null;
          created_at: string;
          eta_at: string | null;
          id: string;
          responder_id: string;
          status: Database["public"]["Enums"]["response_commitment_status"];
          updated_at: string;
          withdrawal_reason: string | null;
        };
        Insert: {
          assistance_types: Database["public"]["Enums"]["assistance_type"][];
          availability_note?: string | null;
          case_id: string;
          confirmed_by?: string | null;
          created_at?: string;
          eta_at?: string | null;
          id?: string;
          responder_id: string;
          status?: Database["public"]["Enums"]["response_commitment_status"];
          updated_at?: string;
          withdrawal_reason?: string | null;
        };
        Update: {
          assistance_types?: Database["public"]["Enums"]["assistance_type"][];
          availability_note?: string | null;
          case_id?: string;
          confirmed_by?: string | null;
          created_at?: string;
          eta_at?: string | null;
          id?: string;
          responder_id?: string;
          status?: Database["public"]["Enums"]["response_commitment_status"];
          updated_at?: string;
          withdrawal_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "case_responses_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_responses_confirmed_by_fkey";
            columns: ["confirmed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_responses_responder_id_fkey";
            columns: ["responder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_status_history: {
        Row: {
          actor_id: string | null;
          case_id: string;
          created_at: string;
          id: string;
          new_status: Database["public"]["Enums"]["case_status"];
          previous_status: Database["public"]["Enums"]["case_status"] | null;
          reason: string | null;
        };
        Insert: {
          actor_id?: string | null;
          case_id: string;
          created_at?: string;
          id?: string;
          new_status: Database["public"]["Enums"]["case_status"];
          previous_status?: Database["public"]["Enums"]["case_status"] | null;
          reason?: string | null;
        };
        Update: {
          actor_id?: string | null;
          case_id?: string;
          created_at?: string;
          id?: string;
          new_status?: Database["public"]["Enums"]["case_status"];
          previous_status?: Database["public"]["Enums"]["case_status"] | null;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "case_status_history_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_status_history_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
        ];
      };
      case_status_transitions: {
        Row: {
          from_status: Database["public"]["Enums"]["case_status"];
          requires_moderator: boolean;
          to_status: Database["public"]["Enums"]["case_status"];
        };
        Insert: {
          from_status: Database["public"]["Enums"]["case_status"];
          requires_moderator?: boolean;
          to_status: Database["public"]["Enums"]["case_status"];
        };
        Update: {
          from_status?: Database["public"]["Enums"]["case_status"];
          requires_moderator?: boolean;
          to_status?: Database["public"]["Enums"]["case_status"];
        };
        Relationships: [];
      };
      case_updates: {
        Row: {
          author_id: string;
          body: string;
          case_id: string;
          created_at: string;
          id: string;
          is_pinned: boolean;
        };
        Insert: {
          author_id: string;
          body: string;
          case_id: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
        };
        Update: {
          author_id?: string;
          body?: string;
          case_id?: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "case_updates_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_updates_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
        ];
      };
      case_watchers: {
        Row: {
          case_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_watchers_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_watchers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clinics: {
        Row: {
          emergency_capable: boolean;
          organization_id: string;
          specializations: string | null;
        };
        Insert: {
          emergency_capable?: boolean;
          organization_id: string;
          specializations?: string | null;
        };
        Update: {
          emergency_capable?: boolean;
          organization_id?: string;
          specializations?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clinics_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      comment_replies: {
        Row: {
          author_id: string;
          body: string;
          comment_id: string;
          created_at: string;
          edited_at: string | null;
          id: string;
          is_hidden: boolean;
        };
        Insert: {
          author_id: string;
          body: string;
          comment_id: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          is_hidden?: boolean;
        };
        Update: {
          author_id?: string;
          body?: string;
          comment_id?: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          is_hidden?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "comment_replies_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_replies_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "case_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      content_reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reporter_id: string;
          status: string;
          target_id: string;
          target_type: Database["public"]["Enums"]["report_target_type"];
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reporter_id: string;
          status?: string;
          target_id: string;
          target_type: Database["public"]["Enums"]["report_target_type"];
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: Database["public"]["Enums"]["report_reason"];
          reporter_id?: string;
          status?: string;
          target_id?: string;
          target_type?: Database["public"]["Enums"]["report_target_type"];
        };
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contributions: {
        Row: {
          case_id: string;
          category: Database["public"]["Enums"]["contribution_category"];
          created_at: string;
          id: string;
          user_id: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          case_id: string;
          category: Database["public"]["Enums"]["contribution_category"];
          created_at?: string;
          id?: string;
          user_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          case_id?: string;
          category?: Database["public"]["Enums"]["contribution_category"];
          created_at?: string;
          id?: string;
          user_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contributions_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      foster_profiles: {
        Row: {
          area: string | null;
          available_from: string | null;
          available_until: string | null;
          capacity: number;
          created_at: string;
          id: string;
          is_active: boolean;
          limitations: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          area?: string | null;
          available_from?: string | null;
          available_until?: string | null;
          capacity?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          limitations?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          area?: string | null;
          available_from?: string | null;
          available_until?: string | null;
          capacity?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          limitations?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "foster_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      foster_supported_animal_types: {
        Row: {
          animal_type_id: string;
          foster_profile_id: string;
        };
        Insert: {
          animal_type_id: string;
          foster_profile_id: string;
        };
        Update: {
          animal_type_id?: string;
          foster_profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "foster_supported_animal_types_animal_type_id_fkey";
            columns: ["animal_type_id"];
            isOneToOne: false;
            referencedRelation: "animal_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "foster_supported_animal_types_foster_profile_id_fkey";
            columns: ["foster_profile_id"];
            isOneToOne: false;
            referencedRelation: "foster_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["moderation_action_type"];
          created_at: string;
          id: string;
          moderator_id: string;
          reason: string;
          target_id: string;
          target_type: string;
        };
        Insert: {
          action_type: Database["public"]["Enums"]["moderation_action_type"];
          created_at?: string;
          id?: string;
          moderator_id: string;
          reason: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          action_type?: Database["public"]["Enums"]["moderation_action_type"];
          created_at?: string;
          id?: string;
          moderator_id?: string;
          reason?: string;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey";
            columns: ["moderator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_deliveries: {
        Row: {
          attempted_at: string | null;
          attempts: number;
          created_at: string;
          device_id: string;
          error_code: string | null;
          expo_ticket_id: string | null;
          id: string;
          notification_id: string;
          receipt_checked_at: string | null;
          status: string;
        };
        Insert: {
          attempted_at?: string | null;
          attempts?: number;
          created_at?: string;
          device_id: string;
          error_code?: string | null;
          expo_ticket_id?: string | null;
          id?: string;
          notification_id: string;
          receipt_checked_at?: string | null;
          status?: string;
        };
        Update: {
          attempted_at?: string | null;
          attempts?: number;
          created_at?: string;
          device_id?: string;
          error_code?: string | null;
          expo_ticket_id?: string | null;
          id?: string;
          notification_id?: string;
          receipt_checked_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "user_devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          alert_radius_km: number;
          base_location: unknown;
          critical_override: boolean;
          min_urgency: Database["public"]["Enums"]["urgency_level"];
          quiet_hours_end: string | null;
          quiet_hours_start: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          alert_radius_km?: number;
          base_location?: unknown;
          critical_override?: boolean;
          min_urgency?: Database["public"]["Enums"]["urgency_level"];
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          alert_radius_km?: number;
          base_location?: unknown;
          critical_override?: boolean;
          min_urgency?: Database["public"]["Enums"]["urgency_level"];
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          case_id: string | null;
          category: Database["public"]["Enums"]["notification_category"];
          created_at: string;
          id: string;
          payload: Json;
          read_at: string | null;
          recipient_id: string;
          step: number | null;
        };
        Insert: {
          case_id?: string | null;
          category: Database["public"]["Enums"]["notification_category"];
          created_at?: string;
          id?: string;
          payload?: Json;
          read_at?: string | null;
          recipient_id: string;
          step?: number | null;
        };
        Update: {
          case_id?: string | null;
          category?: Database["public"]["Enums"]["notification_category"];
          created_at?: string;
          id?: string;
          payload?: Json;
          read_at?: string | null;
          recipient_id?: string;
          step?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_availability: {
        Row: {
          hours_text: string | null;
          is_currently_available: boolean;
          opted_in_incident_types: Database["public"]["Enums"]["incident_type"][];
          opted_in_urgency_levels: Database["public"]["Enums"]["urgency_level"][];
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          hours_text?: string | null;
          is_currently_available?: boolean;
          opted_in_incident_types?: Database["public"]["Enums"]["incident_type"][];
          opted_in_urgency_levels?: Database["public"]["Enums"]["urgency_level"][];
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          hours_text?: string | null;
          is_currently_available?: boolean;
          opted_in_incident_types?: Database["public"]["Enums"]["incident_type"][];
          opted_in_urgency_levels?: Database["public"]["Enums"]["urgency_level"][];
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_availability_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          joined_at: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_member_role"];
          user_id: string;
        };
        Insert: {
          joined_at?: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["organization_member_role"];
          user_id: string;
        };
        Update: {
          joined_at?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_services: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          organization_id: string;
          service_name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          organization_id: string;
          service_name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          organization_id?: string;
          service_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_services_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          contact_method: string | null;
          created_at: string;
          description: string | null;
          id: string;
          last_confirmed_at: string;
          name: string;
          org_type: Database["public"]["Enums"]["organization_type"];
          service_area: string | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          contact_method?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          last_confirmed_at?: string;
          name: string;
          org_type: Database["public"]["Enums"]["organization_type"];
          service_area?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          contact_method?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          last_confirmed_at?: string;
          name?: string;
          org_type?: Database["public"]["Enums"]["organization_type"];
          service_area?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          area: string | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          created_at: string;
          deleted_at: string | null;
          full_name: string;
          id: string;
          is_suspended: boolean;
          onboarding_completed_at: string | null;
          preferred_language: Database["public"]["Enums"]["app_language"];
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          area?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          full_name: string;
          id: string;
          is_suspended?: boolean;
          onboarding_completed_at?: string | null;
          preferred_language?: Database["public"]["Enums"]["app_language"];
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          area?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          full_name?: string;
          id?: string;
          is_suspended?: boolean;
          onboarding_completed_at?: string | null;
          preferred_language?: Database["public"]["Enums"]["app_language"];
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      rescue_case_locations: {
        Row: {
          approximate_location: unknown;
          case_id: string;
          change_reason: string | null;
          changed_by: string;
          created_at: string;
          district: string | null;
          division: string | null;
          id: string;
          landmark: string | null;
          location: unknown;
          upazila_or_thana: string | null;
        };
        Insert: {
          approximate_location?: unknown;
          case_id: string;
          change_reason?: string | null;
          changed_by: string;
          created_at?: string;
          district?: string | null;
          division?: string | null;
          id?: string;
          landmark?: string | null;
          location?: unknown;
          upazila_or_thana?: string | null;
        };
        Update: {
          approximate_location?: unknown;
          case_id?: string;
          change_reason?: string | null;
          changed_by?: string;
          created_at?: string;
          district?: string | null;
          division?: string | null;
          id?: string;
          landmark?: string | null;
          location?: unknown;
          upazila_or_thana?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rescue_case_locations_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_case_locations_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rescue_cases: {
        Row: {
          animal_type_id: string | null;
          approximate_location: unknown;
          closed_at: string | null;
          closure_reason: string | null;
          coordinator_id: string | null;
          created_at: string;
          creator_id: string;
          creator_on_site: boolean;
          description: string | null;
          district: string | null;
          division: string | null;
          exact_location_visibility: Database["public"]["Enums"]["case_location_sensitivity"];
          id: string;
          idempotency_key: string | null;
          incident_type: Database["public"]["Enums"]["incident_type"];
          landmark: string | null;
          last_seen_at: string | null;
          location: unknown;
          organization_id: string | null;
          public_reference: string;
          reported_at: string;
          status: Database["public"]["Enums"]["case_status"];
          title: string;
          upazila_or_thana: string | null;
          updated_at: string;
          urgency: Database["public"]["Enums"]["urgency_level"];
        };
        Insert: {
          animal_type_id?: string | null;
          approximate_location?: unknown;
          closed_at?: string | null;
          closure_reason?: string | null;
          coordinator_id?: string | null;
          created_at?: string;
          creator_id: string;
          creator_on_site?: boolean;
          description?: string | null;
          district?: string | null;
          division?: string | null;
          exact_location_visibility?: Database["public"]["Enums"]["case_location_sensitivity"];
          id?: string;
          idempotency_key?: string | null;
          incident_type: Database["public"]["Enums"]["incident_type"];
          landmark?: string | null;
          last_seen_at?: string | null;
          location?: unknown;
          organization_id?: string | null;
          public_reference?: string;
          reported_at?: string;
          status?: Database["public"]["Enums"]["case_status"];
          title: string;
          upazila_or_thana?: string | null;
          updated_at?: string;
          urgency: Database["public"]["Enums"]["urgency_level"];
        };
        Update: {
          animal_type_id?: string | null;
          approximate_location?: unknown;
          closed_at?: string | null;
          closure_reason?: string | null;
          coordinator_id?: string | null;
          created_at?: string;
          creator_id?: string;
          creator_on_site?: boolean;
          description?: string | null;
          district?: string | null;
          division?: string | null;
          exact_location_visibility?: Database["public"]["Enums"]["case_location_sensitivity"];
          id?: string;
          idempotency_key?: string | null;
          incident_type?: Database["public"]["Enums"]["incident_type"];
          landmark?: string | null;
          last_seen_at?: string | null;
          location?: unknown;
          organization_id?: string | null;
          public_reference?: string;
          reported_at?: string;
          status?: Database["public"]["Enums"]["case_status"];
          title?: string;
          upazila_or_thana?: string | null;
          updated_at?: string;
          urgency?: Database["public"]["Enums"]["urgency_level"];
        };
        Relationships: [
          {
            foreignKeyName: "rescue_cases_animal_type_id_fkey";
            columns: ["animal_type_id"];
            isOneToOne: false;
            referencedRelation: "animal_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_cases_coordinator_id_fkey";
            columns: ["coordinator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_cases_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_cases_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      rescue_media: {
        Row: {
          case_id: string;
          comment_id: string | null;
          created_at: string;
          exif_stripped: boolean;
          id: string;
          is_graphic: boolean;
          storage_path: string;
          update_id: string | null;
          uploader_id: string;
        };
        Insert: {
          case_id: string;
          comment_id?: string | null;
          created_at?: string;
          exif_stripped?: boolean;
          id?: string;
          is_graphic?: boolean;
          storage_path: string;
          update_id?: string | null;
          uploader_id: string;
        };
        Update: {
          case_id?: string;
          comment_id?: string | null;
          created_at?: string;
          exif_stripped?: boolean;
          id?: string;
          is_graphic?: boolean;
          storage_path?: string;
          update_id?: string | null;
          uploader_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rescue_media_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_media_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "case_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_media_update_id_fkey";
            columns: ["update_id"];
            isOneToOne: false;
            referencedRelation: "case_updates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_media_uploader_id_fkey";
            columns: ["uploader_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rescue_outcomes: {
        Row: {
          case_id: string;
          created_at: string;
          final_update: string;
          follow_up_case_id: string | null;
          id: string;
          outcome: Database["public"]["Enums"]["closure_outcome"];
          recorded_by: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          final_update: string;
          follow_up_case_id?: string | null;
          id?: string;
          outcome: Database["public"]["Enums"]["closure_outcome"];
          recorded_by: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          final_update?: string;
          follow_up_case_id?: string | null;
          id?: string;
          outcome?: Database["public"]["Enums"]["closure_outcome"];
          recorded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rescue_outcomes_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_outcomes_follow_up_case_id_fkey";
            columns: ["follow_up_case_id"];
            isOneToOne: false;
            referencedRelation: "rescue_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rescue_outcomes_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      shelters: {
        Row: {
          capacity_available: number | null;
          capacity_total: number | null;
          organization_id: string;
        };
        Insert: {
          capacity_available?: number | null;
          capacity_total?: number | null;
          organization_id: string;
        };
        Update: {
          capacity_available?: number | null;
          capacity_total?: number | null;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shelters_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          awarded_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          awarded_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          awarded_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_availability: {
        Row: {
          is_available: boolean;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          is_available?: boolean;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          is_available?: boolean;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_availability_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_devices: {
        Row: {
          created_at: string;
          expo_push_token: string;
          id: string;
          is_active: boolean;
          last_seen_at: string;
          platform: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expo_push_token: string;
          id?: string;
          is_active?: boolean;
          last_seen_at?: string;
          platform: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expo_push_token?: string;
          id?: string;
          is_active?: boolean;
          last_seen_at?: string;
          platform?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferred_animal_types: {
        Row: {
          animal_type_id: string;
          user_id: string;
        };
        Insert: {
          animal_type_id: string;
          user_id: string;
        };
        Update: {
          animal_type_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferred_animal_types_animal_type_id_fkey";
            columns: ["animal_type_id"];
            isOneToOne: false;
            referencedRelation: "animal_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_preferred_animal_types_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_private_details: {
        Row: {
          community_rules_accepted_at: string | null;
          created_at: string;
          email: string;
          location_policy_accepted_at: string | null;
          phone_normalized: string | null;
          phone_verified: boolean;
          privacy_notice_accepted_at: string | null;
          terms_accepted_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          community_rules_accepted_at?: string | null;
          created_at?: string;
          email: string;
          location_policy_accepted_at?: string | null;
          phone_normalized?: string | null;
          phone_verified?: boolean;
          privacy_notice_accepted_at?: string | null;
          terms_accepted_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          community_rules_accepted_at?: string | null;
          created_at?: string;
          email?: string;
          location_policy_accepted_at?: string | null;
          phone_normalized?: string | null;
          phone_verified?: boolean;
          privacy_notice_accepted_at?: string | null;
          terms_accepted_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_private_details_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      volunteer_capabilities: {
        Row: {
          capability: Database["public"]["Enums"]["volunteer_capability_type"];
          user_id: string;
        };
        Insert: {
          capability: Database["public"]["Enums"]["volunteer_capability_type"];
          user_id: string;
        };
        Update: {
          capability?: Database["public"]["Enums"]["volunteer_capability_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_capabilities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
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
      can_confirm_contribution: {
        Args: { p_case_id: string };
        Returns: boolean;
      };
      case_audience: {
        Args: { p_actor: string; p_case_id: string };
        Returns: {
          user_id: string;
        }[];
      };
      case_needs_alerts: { Args: { p_case_id: string }; Returns: boolean };
      claim_pending_deliveries: {
        Args: { p_limit?: number };
        Returns: {
          case_id: string;
          category: Database["public"]["Enums"]["notification_category"];
          delivery_id: string;
          expo_push_token: string;
          language: Database["public"]["Enums"]["app_language"];
          payload: Json;
        }[];
      };
      claim_receipt_checks: {
        Args: { p_limit?: number };
        Returns: {
          delivery_id: string;
          expo_ticket_id: string;
        }[];
      };
      close_case: {
        Args: {
          p_case_id: string;
          p_contributions?: Json;
          p_final_update: string;
          p_follow_up_case_id?: string;
          p_outcome: Database["public"]["Enums"]["closure_outcome"];
          p_reason?: string;
        };
        Returns: {
          case_id: string;
          created_at: string;
          final_update: string;
          follow_up_case_id: string | null;
          id: string;
          outcome: Database["public"]["Enums"]["closure_outcome"];
          recorded_by: string;
        };
        SetofOptions: {
          from: "*";
          to: "rescue_outcomes";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      complete_onboarding: {
        Args: {
          p_alert_radius_km: number;
          p_capabilities: Database["public"]["Enums"]["volunteer_capability_type"][];
          p_preferred_animal_type_ids: string[];
        };
        Returns: undefined;
      };
      create_case: {
        Args: {
          p_animal_type_id: string;
          p_creator_on_site: boolean;
          p_description: string;
          p_district: string;
          p_division: string;
          p_idempotency_key: string;
          p_incident_type: Database["public"]["Enums"]["incident_type"];
          p_landmark: string;
          p_last_seen_at?: string;
          p_location: unknown;
          p_upazila_or_thana: string;
          p_urgency: Database["public"]["Enums"]["urgency_level"];
        };
        Returns: {
          animal_type_id: string | null;
          approximate_location: unknown;
          closed_at: string | null;
          closure_reason: string | null;
          coordinator_id: string | null;
          created_at: string;
          creator_id: string;
          creator_on_site: boolean;
          description: string | null;
          district: string | null;
          division: string | null;
          exact_location_visibility: Database["public"]["Enums"]["case_location_sensitivity"];
          id: string;
          idempotency_key: string | null;
          incident_type: Database["public"]["Enums"]["incident_type"];
          landmark: string | null;
          last_seen_at: string | null;
          location: unknown;
          organization_id: string | null;
          public_reference: string;
          reported_at: string;
          status: Database["public"]["Enums"]["case_status"];
          title: string;
          upazila_or_thana: string | null;
          updated_at: string;
          urgency: Database["public"]["Enums"]["urgency_level"];
        };
        SetofOptions: {
          from: "*";
          to: "rescue_cases";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_profile_is_suspended: { Args: never; Returns: boolean };
      current_profile_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      dispatch_all_case_alerts: { Args: never; Returns: number };
      dispatch_case_alerts: { Args: { p_case_id: string }; Returns: number };
      enqueue_notification: {
        Args: {
          p_case_id: string;
          p_category: Database["public"]["Enums"]["notification_category"];
          p_payload?: Json;
          p_recipient_id: string;
        };
        Returns: undefined;
      };
      extract_mentions: { Args: { p_body: string }; Returns: string[] };
      find_alert_candidates: {
        Args: { p_case_id: string; p_radius_km: number };
        Returns: {
          distance_km: number;
          user_id: string;
        }[];
      };
      find_nearby_duplicate_cases: {
        Args: {
          p_location: unknown;
          p_radius_meters?: number;
          p_since_minutes?: number;
        };
        Returns: {
          distance_meters: number;
          id: string;
          public_reference: string;
          reported_at: string;
          status: Database["public"]["Enums"]["case_status"];
          title: string;
          urgency: Database["public"]["Enums"]["urgency_level"];
        }[];
      };
      generate_public_reference: { Args: never; Returns: string };
      get_case_exact_location: {
        Args: { p_case_id: string };
        Returns: {
          latitude: number;
          longitude: number;
        }[];
      };
      get_case_location_history: {
        Args: { p_case_id: string };
        Returns: {
          change_reason: string;
          changed_by: string;
          created_at: string;
          id: string;
          landmark: string;
          location: unknown;
        }[];
      };
      get_responder_phone: { Args: { p_response_id: string }; Returns: string };
      get_user_rescue_history: {
        Args: { p_user_id: string };
        Returns: {
          case_id: string;
          case_title: string;
          category: Database["public"]["Enums"]["contribution_category"];
          closed_at: string;
          outcome: Database["public"]["Enums"]["closure_outcome"];
          public_reference: string;
        }[];
      };
      incident_type_label_en: {
        Args: { p_incident_type: Database["public"]["Enums"]["incident_type"] };
        Returns: string;
      };
      incident_type_matches_capability: {
        Args: {
          p_capability: Database["public"]["Enums"]["volunteer_capability_type"];
          p_incident_type: Database["public"]["Enums"]["incident_type"];
        };
        Returns: boolean;
      };
      is_accepted_responder: { Args: { p_case_id: string }; Returns: boolean };
      is_case_coordinator: { Args: { p_case_id: string }; Returns: boolean };
      is_case_creator: { Args: { p_case_id: string }; Returns: boolean };
      is_case_participant: { Args: { p_case_id: string }; Returns: boolean };
      is_case_visible: { Args: { p_case_id: string }; Returns: boolean };
      is_in_quiet_hours: {
        Args: { p_at?: string; p_end: string; p_start: string };
        Returns: boolean;
      };
      is_moderator_or_admin: { Args: never; Returns: boolean };
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean };
      is_org_member: { Args: { p_org_id: string }; Returns: boolean };
      list_feed_cases: {
        Args: {
          p_animal_type_ids?: string[];
          p_incident_types?: Database["public"]["Enums"]["incident_type"][];
          p_include_closed?: boolean;
          p_limit?: number;
          p_offset?: number;
          p_radius_meters?: number;
          p_search_text?: string;
          p_since?: string;
          p_viewer_lat?: number;
          p_viewer_lng?: number;
        };
        Returns: {
          animal_type_slug: string;
          approximate_latitude: number;
          approximate_longitude: number;
          distance_meters: number;
          district: string;
          division: string;
          id: string;
          incident_type: Database["public"]["Enums"]["incident_type"];
          priority_tier: number;
          public_reference: string;
          reported_at: string;
          status: Database["public"]["Enums"]["case_status"];
          thumbnail_is_graphic: boolean;
          thumbnail_storage_path: string;
          title: string;
          total_count: number;
          upazila_or_thana: string;
          updated_at: string;
          urgency: Database["public"]["Enums"]["urgency_level"];
        }[];
      };
      notification_case_payload: { Args: { p_case_id: string }; Returns: Json };
      queue_notification_deliveries: { Args: never; Returns: number };
      record_delivery_results: {
        Args: { p_results: Json };
        Returns: undefined;
      };
      record_receipt_results: { Args: { p_results: Json }; Returns: undefined };
      register_device: {
        Args: { p_expo_push_token: string; p_platform: string };
        Returns: string;
      };
      rescue_cases_public: {
        Args: never;
        Returns: {
          animal_type: string;
          approximate_location: unknown;
          district: string;
          division: string;
          id: string;
          incident_type: Database["public"]["Enums"]["incident_type"];
          last_official_update: string;
          public_reference: string;
          reported_at: string;
          status: Database["public"]["Enums"]["case_status"];
          title: string;
          upazila_or_thana: string;
          updated_at: string;
          urgency: Database["public"]["Enums"]["urgency_level"];
        }[];
      };
      transition_case_status: {
        Args: {
          p_actor_id: string;
          p_case_id: string;
          p_new_status: Database["public"]["Enums"]["case_status"];
          p_reason?: string;
        };
        Returns: {
          animal_type_id: string | null;
          approximate_location: unknown;
          closed_at: string | null;
          closure_reason: string | null;
          coordinator_id: string | null;
          created_at: string;
          creator_id: string;
          creator_on_site: boolean;
          description: string | null;
          district: string | null;
          division: string | null;
          exact_location_visibility: Database["public"]["Enums"]["case_location_sensitivity"];
          id: string;
          idempotency_key: string | null;
          incident_type: Database["public"]["Enums"]["incident_type"];
          landmark: string | null;
          last_seen_at: string | null;
          location: unknown;
          organization_id: string | null;
          public_reference: string;
          reported_at: string;
          status: Database["public"]["Enums"]["case_status"];
          title: string;
          upazila_or_thana: string | null;
          updated_at: string;
          urgency: Database["public"]["Enums"]["urgency_level"];
        };
        SetofOptions: {
          from: "*";
          to: "rescue_cases";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      unregister_device: {
        Args: { p_expo_push_token: string };
        Returns: undefined;
      };
    };
    Enums: {
      account_restriction_type:
        "warning" | "restricted" | "suspended" | "banned";
      app_language: "bn" | "en";
      app_role:
        | "guest"
        | "registered_user"
        | "trusted_volunteer"
        | "organization_member"
        | "organization_administrator"
        | "moderator"
        | "administrator";
      assistance_type:
        | "on_site_rescue"
        | "transport"
        | "veterinary_treatment"
        | "temporary_foster"
        | "shelter_coordination"
        | "case_coordination"
        | "financial_support";
      case_location_sensitivity: "standard" | "restricted";
      case_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "open"
        | "response_committed"
        | "responder_en_route"
        | "animal_located"
        | "rescue_in_progress"
        | "transporting"
        | "at_clinic_foster_shelter"
        | "follow_up_required"
        | "resolved"
        | "closed"
        | "no_longer_found"
        | "duplicate"
        | "false_report"
        | "spam"
        | "unsafe_or_prohibited_content"
        | "cancelled_by_reporter"
        | "closed_by_moderator";
      closure_outcome:
        | "successfully_rescued"
        | "treated_and_returned_safely"
        | "transferred_to_veterinary_care"
        | "transferred_to_organization"
        | "moved_to_temporary_foster"
        | "moved_to_shelter"
        | "adopted"
        | "recovered_without_intervention"
        | "could_not_be_found"
        | "duplicate_report"
        | "report_inaccurate"
        | "died_before_help_arrived"
        | "died_during_or_after_treatment"
        | "other_documented_outcome";
      contribution_category:
        | "on_site_responder"
        | "transport_volunteer"
        | "foster_provider"
        | "veterinary_support"
        | "case_coordinator"
        | "organization_responder"
        | "adoption_facilitator"
        | "moderator_contribution";
      incident_type:
        | "injured_animal"
        | "road_accident"
        | "critically_ill_animal"
        | "trapped_animal"
        | "abandoned_animal"
        | "abuse_or_cruelty_suspected"
        | "mother_with_babies"
        | "orphaned_babies"
        | "traffic_risk_animal"
        | "temporary_foster_needed"
        | "shelter_needed"
        | "transport_needed"
        | "veterinary_treatment_needed"
        | "lost_animal_found"
        | "adoption_needed"
        | "other_animal_welfare_concern";
      moderation_action_type:
        | "hide_content"
        | "merge_duplicate"
        | "redact_personal_info"
        | "warn_account"
        | "restrict_account"
        | "suspend_account"
        | "ban_account"
        | "reopen_case"
        | "correct_status"
        | "other";
      notification_category:
        | "new_critical_case_nearby"
        | "new_urgent_case_nearby"
        | "radius_expanded_case"
        | "response_accepted_or_changed"
        | "official_case_update"
        | "reply_or_mention"
        | "case_status_changed"
        | "case_closed"
        | "follow_up_requested"
        | "moderation_or_account";
      organization_member_role: "member" | "administrator";
      organization_type:
        | "clinic"
        | "shelter"
        | "ngo"
        | "rescue_group"
        | "individual_coordinator";
      report_reason:
        | "spam"
        | "duplicate"
        | "fraud"
        | "cruelty"
        | "graphic_content"
        | "unsafe_advice"
        | "harassment"
        | "privacy_exposure"
        | "other";
      report_target_type: "case" | "comment" | "profile" | "media" | "reply";
      response_commitment_status:
        | "committed"
        | "confirmed"
        | "completed"
        | "declined"
        | "unresponsive"
        | "withdrawn";
      urgency_level:
        "critical" | "urgent" | "support_needed" | "adoption_community";
      verification_status: "pending" | "verified" | "rejected";
      volunteer_capability_type:
        | "on_site_rescue"
        | "transport"
        | "veterinary_professional"
        | "veterinary_assistant"
        | "temporary_foster"
        | "shelter_coordination"
        | "adoption_support"
        | "case_coordination"
        | "financial_support_interest";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_restriction_type: [
        "warning",
        "restricted",
        "suspended",
        "banned",
      ],
      app_language: ["bn", "en"],
      app_role: [
        "guest",
        "registered_user",
        "trusted_volunteer",
        "organization_member",
        "organization_administrator",
        "moderator",
        "administrator",
      ],
      assistance_type: [
        "on_site_rescue",
        "transport",
        "veterinary_treatment",
        "temporary_foster",
        "shelter_coordination",
        "case_coordination",
        "financial_support",
      ],
      case_location_sensitivity: ["standard", "restricted"],
      case_status: [
        "draft",
        "submitted",
        "under_review",
        "open",
        "response_committed",
        "responder_en_route",
        "animal_located",
        "rescue_in_progress",
        "transporting",
        "at_clinic_foster_shelter",
        "follow_up_required",
        "resolved",
        "closed",
        "no_longer_found",
        "duplicate",
        "false_report",
        "spam",
        "unsafe_or_prohibited_content",
        "cancelled_by_reporter",
        "closed_by_moderator",
      ],
      closure_outcome: [
        "successfully_rescued",
        "treated_and_returned_safely",
        "transferred_to_veterinary_care",
        "transferred_to_organization",
        "moved_to_temporary_foster",
        "moved_to_shelter",
        "adopted",
        "recovered_without_intervention",
        "could_not_be_found",
        "duplicate_report",
        "report_inaccurate",
        "died_before_help_arrived",
        "died_during_or_after_treatment",
        "other_documented_outcome",
      ],
      contribution_category: [
        "on_site_responder",
        "transport_volunteer",
        "foster_provider",
        "veterinary_support",
        "case_coordinator",
        "organization_responder",
        "adoption_facilitator",
        "moderator_contribution",
      ],
      incident_type: [
        "injured_animal",
        "road_accident",
        "critically_ill_animal",
        "trapped_animal",
        "abandoned_animal",
        "abuse_or_cruelty_suspected",
        "mother_with_babies",
        "orphaned_babies",
        "traffic_risk_animal",
        "temporary_foster_needed",
        "shelter_needed",
        "transport_needed",
        "veterinary_treatment_needed",
        "lost_animal_found",
        "adoption_needed",
        "other_animal_welfare_concern",
      ],
      moderation_action_type: [
        "hide_content",
        "merge_duplicate",
        "redact_personal_info",
        "warn_account",
        "restrict_account",
        "suspend_account",
        "ban_account",
        "reopen_case",
        "correct_status",
        "other",
      ],
      notification_category: [
        "new_critical_case_nearby",
        "new_urgent_case_nearby",
        "radius_expanded_case",
        "response_accepted_or_changed",
        "official_case_update",
        "reply_or_mention",
        "case_status_changed",
        "case_closed",
        "follow_up_requested",
        "moderation_or_account",
      ],
      organization_member_role: ["member", "administrator"],
      organization_type: [
        "clinic",
        "shelter",
        "ngo",
        "rescue_group",
        "individual_coordinator",
      ],
      report_reason: [
        "spam",
        "duplicate",
        "fraud",
        "cruelty",
        "graphic_content",
        "unsafe_advice",
        "harassment",
        "privacy_exposure",
        "other",
      ],
      report_target_type: ["case", "comment", "profile", "media", "reply"],
      response_commitment_status: [
        "committed",
        "confirmed",
        "completed",
        "declined",
        "unresponsive",
        "withdrawn",
      ],
      urgency_level: [
        "critical",
        "urgent",
        "support_needed",
        "adoption_community",
      ],
      verification_status: ["pending", "verified", "rejected"],
      volunteer_capability_type: [
        "on_site_rescue",
        "transport",
        "veterinary_professional",
        "veterinary_assistant",
        "temporary_foster",
        "shelter_coordination",
        "adoption_support",
        "case_coordination",
        "financial_support_interest",
      ],
    },
  },
} as const;
