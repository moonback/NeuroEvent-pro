/**
 * Types des lignes de la base Supabase (schéma `public`).
 *
 * Écrits à la main pour typer le client Supabase et éliminer les `any` du store.
 * Format volontairement compatible avec la sortie de `supabase gen types typescript`
 * : si vous liez la CLI au projet, ce fichier pourra être régénéré tel quel.
 *
 * Les colonnes « enum » (role, status, type, category) sont typées `string` côté
 * base — comme le ferait la génération automatique — puis affinées vers les types
 * métier (UserRole, MissionStatus…) lors du mapping dans le store.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          role: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      admin_preferences: {
        Row: {
          user_id: string;
          language: string;
          timezone: string;
          notifications: string[];
          is_online: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          language?: string;
          timezone?: string;
          notifications?: string[];
          is_online?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          language?: string;
          timezone?: string;
          notifications?: string[];
          is_online?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      technicians: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          specialty: string;
          color: string;
          skills: string[] | null;
          driver_license: any | null;
          avatar_url: string | null;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          specialty: string;
          color: string;
          skills?: string[] | null;
          driver_license?: any | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          specialty?: string;
          color?: string;
          skills?: string[] | null;
          driver_license?: any | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      technician_unavailabilities: {
        Row: {
          id: string;
          technician_id: string;
          start_date: string;
          end_date: string;
          type: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          technician_id: string;
          start_date: string;
          end_date: string;
          type?: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          technician_id?: string;
          start_date?: string;
          end_date?: string;
          type?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      trucks: {
        Row: {
          id: string;
          name: string;
          plate: string;
          volume: number;
        };
        Insert: {
          id?: string;
          name: string;
          plate: string;
          volume: number;
        };
        Update: {
          id?: string;
          name?: string;
          plate?: string;
          volume?: number;
        };
        Relationships: [];
      };
      equipments: {
        Row: {
          id: string;
          name: string;
          category: string;
          total_quantity: number;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          total_quantity: number;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          total_quantity?: number;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          title: string;
          type: string;
          client: string;
          client_id: string | null;
          address: string;
          start_date: string;
          end_date: string;
          truck_id: string | null;
          required_skills: string[] | null;
          status: string;
          color: string;
          signature_url: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          type: string;
          client: string;
          client_id?: string | null;
          address: string;
          start_date: string;
          end_date: string;
          truck_id?: string | null;
          required_skills?: string[] | null;
          status: string;
          color: string;
          signature_url?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          type?: string;
          client?: string;
          client_id?: string | null;
          address?: string;
          start_date?: string;
          end_date?: string;
          truck_id?: string | null;
          required_skills?: string[] | null;
          status?: string;
          color?: string;
          signature_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      mission_technicians: {
        Row: {
          mission_id: string;
          technician_id: string;
        };
        Insert: {
          mission_id: string;
          technician_id: string;
        };
        Update: {
          mission_id?: string;
          technician_id?: string;
        };
        Relationships: [];
      };
      mission_equipments: {
        Row: {
          mission_id: string;
          equipment_id: string;
          quantity: number;
          checked: boolean | null;
        };
        Insert: {
          mission_id: string;
          equipment_id: string;
          quantity: number;
          checked?: boolean | null;
        };
        Update: {
          mission_id?: string;
          equipment_id?: string;
          quantity?: number;
          checked?: boolean | null;
        };
        Relationships: [];
      };
      mission_time_logs: {
        Row: {
          id: string;
          mission_id: string;
          technician_id: string;
          start_time: string;
          end_time: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          technician_id: string;
          start_time: string;
          end_time?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          technician_id?: string;
          start_time?: string;
          end_time?: string | null;
          note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      mission_photos: {
        Row: {
          id: string;
          mission_id: string;
          type: string; // 'before' | 'after'
          url: string;
          file_path: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          type: string;
          url: string;
          file_path: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          type?: string;
          url?: string;
          file_path?: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

/** Raccourcis pratiques pour récupérer le type d'une ligne / insertion / mise à jour. */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
