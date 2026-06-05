/**
 * Tipos de la base de datos (alineados con supabase/migrations/*).
 * Para regenerar automáticamente desde tu proyecto:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type AppRole = 'admin' | 'lider' | 'voluntario' | 'simpatizante';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  document_id: string | null;
  city: string | null;
  department: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referred_by: string | null;
  points: number;
  carnet_number: string | null;
  consent_data: boolean;
  consent_at: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  assistant: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface Citation {
  title: string;
  url?: string;
  kind?: string;
  quote?: string;
}

export interface FactCheck {
  id: string;
  user_id: string | null;
  input_type: 'texto' | 'url' | 'imagen';
  input_text: string | null;
  input_url: string | null;
  claim: string | null;
  verdict: Verdict;
  confidence: number;
  explanation: string | null;
  evidence: Evidence[];
  is_public: boolean;
  created_at: string;
}

export type Verdict =
  | 'verdadero'
  | 'falso'
  | 'engañoso'
  | 'sin_evidencia'
  | 'en_contexto';

export interface Evidence {
  title: string;
  url?: string;
  quote?: string;
  kind?: string;
}

export interface ShareLink {
  id: string;
  user_id: string;
  slug: string;
  channel: string | null;
  campaign: string | null;
  target_path: string;
  title: string | null;
  clicks: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  code: string;
  title: string;
  description: string | null;
  points: number;
  icon: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface LeaderboardRow {
  id: string;
  full_name: string | null;
  city: string | null;
  department: string | null;
  points: number;
  avatar_url: string | null;
  position: number;
}

/**
 * Forma mínima que espera @supabase/supabase-js para tipar consultas.
 * Las tablas no listadas siguen funcionando (tipadas laxamente).
 */
type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };

export interface UserRole {
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  created_at: string;
}

export interface KbDocument {
  id: string;
  title: string;
  kind: string;
  source_url: string | null;
  region: string | null;
  published: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: Row<Profile>;
      user_roles: Row<UserRole>;
      kb_documents: Row<KbDocument>;
      chat_sessions: Row<ChatSession>;
      chat_messages: Row<ChatMessage>;
      fact_checks: Row<FactCheck>;
      share_links: Row<ShareLink>;
      challenges: Row<Challenge>;
    };
    Views: {
      v_leaderboard: { Row: LeaderboardRow };
    };
    Functions: {
      record_action: {
        Args: { _action: string; _ref?: string | null; _meta?: Json };
        Returns: number;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { app_role: AppRole };
  };
}
