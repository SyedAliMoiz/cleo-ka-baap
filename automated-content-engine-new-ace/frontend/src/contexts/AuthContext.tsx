"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/helpers/networking";

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  tier: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      // Set up axios interceptor with the token
      apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${storedToken}`;
      // Verify token and get user info
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await apiClient.post("/auth/profile");
      setUser(response.data);
      setIsLoading(false);
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      delete apiClient.defaults.headers.common["Authorization"];
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);
      localStorage.setItem("auth_token", access_token);
      apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${access_token}`;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    delete apiClient.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
