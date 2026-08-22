export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          activity_id: string;
          category: string;
          city_id: string;
          cost_estimate_inr: number | null;
          created_at: string;
          created_by_user_id: string | null;
          description: string | null;
          duration_minutes: number | null;
          image_url: string | null;
          is_approved: boolean;
          name: string;
          rating: number | null;
        };
        Insert: {
          activity_id?: string;
          category: string;
          city_id: string;
          cost_estimate_inr?: number | null;
          created_at?: string;
          created_by_user_id?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          image_url?: string | null;
          is_approved?: boolean;
          name: string;
          rating?: number | null;
        };
        Update: {
          activity_id?: string;
          category?: string;
          city_id?: string;
          cost_estimate_inr?: number | null;
          created_at?: string;
          created_by_user_id?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          image_url?: string | null;
          is_approved?: boolean;
          name?: string;
          rating?: number | null;
        };
        Relationships: [];
      };
      admin_action_logs: {
        Row: {
          action: string;
          admin_id: string;
          created_at: string;
          log_id: string;
          notes: string | null;
          target_user_id: string | null;
        };
        Insert: {
          action: string;
          admin_id: string;
          created_at?: string;
          log_id?: string;
          notes?: string | null;
          target_user_id?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string;
          created_at?: string;
          log_id?: string;
          notes?: string | null;
          target_user_id?: string | null;
        };
        Relationships: [];
      };
      cities: {
        Row: {
          city_id: string;
          cost_index: number | null;
          country: string;
          created_at: string;
          description: string | null;
          image_url: string | null;
          latitude: number | null;
          longitude: number | null;
          name: string;
          popularity_score: number;
          region: string | null;
        };
        Insert: {
          city_id?: string;
          cost_index?: number | null;
          country: string;
          created_at?: string;
          description?: string | null;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          popularity_score?: number;
          region?: string | null;
        };
        Update: {
          city_id?: string;
          cost_index?: number | null;
          country?: string;
          created_at?: string;
          description?: string | null;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          popularity_score?: number;
          region?: string | null;
        };
        Relationships: [];
      };
      community_posts: {
        Row: {
          activity_id: string | null;
          content: string;
          created_at: string;
          image_url: string | null;
          post_id: string;
          trip_id: string | null;
          user_id: string;
        };
        Insert: {
          activity_id?: string | null;
          content: string;
          created_at?: string;
          image_url?: string | null;
          post_id?: string;
          trip_id?: string | null;
          user_id: string;
        };
        Update: {
          activity_id?: string | null;
          content?: string;
          created_at?: string;
          image_url?: string | null;
          post_id?: string;
          trip_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      currency_rates: {
        Row: {
          currency_code: string;
          rate_to_inr: number;
          updated_at: string;
        };
        Insert: {
          currency_code: string;
          rate_to_inr: number;
          updated_at?: string;
        };
        Update: {
          currency_code?: string;
          rate_to_inr?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount_inr: number;
          category: string;
          created_at: string;
          description: string | null;
          expense_date: string | null;
          expense_id: string;
          stop_id: string | null;
          trip_id: string;
        };
        Insert: {
          amount_inr: number;
          category: string;
          created_at?: string;
          description?: string | null;
          expense_date?: string | null;
          expense_id?: string;
          stop_id?: string | null;
          trip_id: string;
        };
        Update: {
          amount_inr?: number;
          category?: string;
          created_at?: string;
          description?: string | null;
          expense_date?: string | null;
          expense_id?: string;
          stop_id?: string | null;
          trip_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          comment_id: string;
          content: string;
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          comment_id?: string;
          content: string;
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          content?: string;
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profile_private: {
        Row: {
          phone_number: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          phone_number?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          phone_number?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          bio: string | null;
          created_at: string;
          first_name: string;
          home_city: string | null;
          home_country: string | null;
          id: string;
          last_name: string;
          photo_url: string | null;
          preferred_currency: string;
          role: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          first_name?: string;
          home_city?: string | null;
          home_country?: string | null;
          id: string;
          last_name?: string;
          photo_url?: string | null;
          preferred_currency?: string;
          role?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          first_name?: string;
          home_city?: string | null;
          home_country?: string | null;
          id?: string;
          last_name?: string;
          photo_url?: string | null;
          preferred_currency?: string;
          role?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_destinations: {
        Row: {
          city_id: string;
          saved_at: string;
          saved_id: string;
          user_id: string;
        };
        Insert: {
          city_id: string;
          saved_at?: string;
          saved_id?: string;
          user_id: string;
        };
        Update: {
          city_id?: string;
          saved_at?: string;
          saved_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      trip_activities: {
        Row: {
          activity_id: string | null;
          custom_name: string | null;
          day_number: number;
          notes: string | null;
          order_index: number | null;
          planned_cost_inr: number | null;
          scheduled_time: string | null;
          stop_id: string;
          trip_activity_id: string;
        };
        Insert: {
          activity_id?: string | null;
          custom_name?: string | null;
          day_number: number;
          notes?: string | null;
          order_index?: number | null;
          planned_cost_inr?: number | null;
          scheduled_time?: string | null;
          stop_id: string;
          trip_activity_id?: string;
        };
        Update: {
          activity_id?: string | null;
          custom_name?: string | null;
          day_number?: number;
          notes?: string | null;
          order_index?: number | null;
          planned_cost_inr?: number | null;
          scheduled_time?: string | null;
          stop_id?: string;
          trip_activity_id?: string;
        };
        Relationships: [];
      };
      trip_collaborators: {
        Row: {
          invited_at: string;
          permission: string;
          status: string;
          trip_id: string;
          user_id: string;
        };
        Insert: {
          invited_at?: string;
          permission?: string;
          status?: string;
          trip_id: string;
          user_id: string;
        };
        Update: {
          invited_at?: string;
          permission?: string;
          status?: string;
          trip_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      trip_stops: {
        Row: {
          city_id: string;
          end_date: string;
          notes: string | null;
          order_index: number;
          section_budget_inr: number | null;
          start_date: string;
          stop_id: string;
          trip_id: string;
        };
        Insert: {
          city_id: string;
          end_date: string;
          notes?: string | null;
          order_index: number;
          section_budget_inr?: number | null;
          start_date: string;
          stop_id?: string;
          trip_id: string;
        };
        Update: {
          city_id?: string;
          end_date?: string;
          notes?: string | null;
          order_index?: number;
          section_budget_inr?: number | null;
          start_date?: string;
          stop_id?: string;
          trip_id?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          cover_photo_url: string | null;
          created_at: string;
          description: string | null;
          end_date: string | null;
          estimated_budget_inr: number | null;
          is_public: boolean;
          name: string;
          share_token: string | null;
          source_trip_id: string | null;
          start_date: string | null;
          status: string;
          trip_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cover_photo_url?: string | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          estimated_budget_inr?: number | null;
          is_public?: boolean;
          name: string;
          share_token?: string | null;
          source_trip_id?: string | null;
          start_date?: string;
          status?: string;
          trip_id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cover_photo_url?: string | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          estimated_budget_inr?: number | null;
          is_public?: boolean;
          name?: string;
          share_token?: string | null;
          source_trip_id?: string | null;
          start_date?: string;
          status?: string;
          trip_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_edit_trip: { Args: { _trip_id: string }; Returns: boolean };
      can_view_trip: { Args: { _trip_id: string }; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      is_trip_collaborator: {
        Args: { _min_permission?: string; _trip_id: string };
        Returns: boolean;
      };
      owns_trip: { Args: { _trip_id: string }; Returns: boolean };
      trip_is_public: { Args: { _trip_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
