import React, { useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { User } from "../types/database";
import { supabaseService } from "../services/supabase";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with true to check existing session

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await supabaseService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { user: authUser, error } = await supabaseService.signIn(
        email,
        password,
      );
      if (authUser && !error) {
        setUser(authUser);
        return true;
      }
      console.error("Login error:", error);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const { user: authUser, error } = await supabaseService.signUp(
        email,
        password,
        name,
      );
      if (authUser && !error) {
        // For email confirmation flow, user might be null initially
        // In development with no email confirmation, user should be available
        const currentUser = await supabaseService.getCurrentUser();
        setUser(currentUser);
        return true;
      }
      console.error("Signup error:", error);
      return false;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabaseService.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
