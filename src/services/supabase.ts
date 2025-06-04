import { createClient } from "@supabase/supabase-js";
import {
  User,
  Suggestion,
  Vote,
  Attendance,
  WeekPlan,
} from "../types/database";

// Use VITE_ prefix for Vite, NEXT_PUBLIC_ for Next.js
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL! || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY! ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          is_admin?: boolean;
        };
        Update: {
          name?: string;
          is_admin?: boolean;
        };
      };
      suggestions: {
        Row: {
          id: string;
          user_id: string;
          restaurant: string;
          description: string | null;
          week_of: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          restaurant: string;
          description?: string;
          week_of: string;
        };
        Update: {
          restaurant?: string;
          description?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          suggestion_id: string;
          rank: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          suggestion_id: string;
          rank: number;
        };
        Update: {
          rank: number;
        };
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          week_of: string;
          is_attending: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          week_of: string;
          is_attending: boolean;
        };
        Update: {
          is_attending: boolean;
        };
      };
      week_plans: {
        Row: {
          id: string;
          week_of: string;
          selected_suggestion_id: string | null;
          admin_override: boolean;
          final_destination: string | null;
          is_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          week_of: string;
          selected_suggestion_id?: string;
          admin_override?: boolean;
          final_destination?: string;
          is_confirmed?: boolean;
        };
        Update: {
          selected_suggestion_id?: string;
          admin_override?: boolean;
          final_destination?: string;
          is_confirmed?: boolean;
        };
      };
    };
  };
}

export class SupabaseService {
  // Auth methods
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });
    return { user: data.user, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile as User;
  }

  // Data methods
  async getSuggestions(weekOf: string): Promise<Suggestion[]> {
    const { data, error } = await supabase
      .from("suggestions")
      .select(
        `
        *,
        profiles:user_id (name)
      `,
      )
      .eq("week_of", weekOf)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data.map((item) => ({
      ...item,
      user_name: item.profiles?.name || "Unknown",
    })) as Suggestion[];
  }

  async addSuggestion(
    suggestion: Database["public"]["Tables"]["suggestions"]["Insert"],
  ): Promise<Suggestion> {
    const { data, error } = await supabase
      .from("suggestions")
      .insert(suggestion)
      .select(
        `
        *,
        profiles:user_id (name)
      `,
      )
      .single();

    if (error) throw error;

    return {
      ...data,
      user_name: data.profiles?.name || "Unknown",
    } as Suggestion;
  }

  async getVotes(weekOf: string): Promise<Vote[]> {
    // Get votes for suggestions in the given week
    const { data, error } = await supabase
      .from("votes")
      .select(
        `
        *,
        suggestions!inner(week_of)
      `,
      )
      .eq("suggestions.week_of", weekOf);

    if (error) throw error;
    return data as Vote[];
  }

  async upsertVote(
    vote: Database["public"]["Tables"]["votes"]["Insert"],
  ): Promise<Vote> {
    const { data, error } = await supabase
      .from("votes")
      .upsert(vote, {
        onConflict: "user_id,suggestion_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Vote;
  }

  async getAttendance(weekOf: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("week_of", weekOf);

    if (error) throw error;
    return (data || []) as Attendance[];
  }

  async upsertAttendance(
    attendance: Database["public"]["Tables"]["attendance"]["Insert"],
  ): Promise<Attendance> {
    const { data, error } = await supabase
      .from("attendance")
      .upsert(attendance, {
        onConflict: "user_id,week_of",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Attendance;
  }

  async getWeekPlan(weekOf: string): Promise<WeekPlan | null> {
    const { data, error } = await supabase
      .from("week_plans")
      .select("*")
      .eq("week_of", weekOf)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as WeekPlan | null;
  }

  async createWeekPlan(
    plan: Database["public"]["Tables"]["week_plans"]["Insert"],
  ): Promise<WeekPlan> {
    const { data, error } = await supabase
      .from("week_plans")
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data as WeekPlan;
  }
}

export const supabaseService = new SupabaseService();
