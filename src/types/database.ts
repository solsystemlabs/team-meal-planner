// src/types/database.ts - Updated with restaurant details
export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at?: string;
}

export interface Suggestion {
  id: string;
  user_id: string;
  user_name: string;
  restaurant: string;
  description: string; // Custom user description/notes
  week_of: string;
  created_at: string;
  // New restaurant detail fields
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  price_level?: number;
  place_id?: string;
}

export interface Vote {
  id: string;
  user_id: string;
  suggestion_id: string;
  rank: number;
}

export interface Attendance {
  id: string;
  user_id: string;
  week_of: string;
  is_attending: boolean;
}

export interface WeekPlan {
  id: string;
  week_of: string;
  selected_suggestion_id: string | null;
  admin_override: boolean;
  final_destination: string | null;
  is_confirmed: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}
