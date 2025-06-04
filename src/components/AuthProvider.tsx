import React, { useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { User } from "../types/database";
import { mockService } from "../services/mockSupabase";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { user: authUser, error } = await mockService.signIn(
        email,
        password,
      );
      if (authUser && !error) {
        setUser(authUser);
        return true;
      }
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
      const { user: authUser, error } = await mockService.signUp(
        email,
        password,
        name,
      );
      if (authUser && !error) {
        setUser(authUser);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await mockService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
