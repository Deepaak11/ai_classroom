/**
 * contexts/AuthContext.js
 * Global authentication state management.
 * Provides user, login, logout functions to all components.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    const userData = { ...data.user, token: data.token };
    setUser(userData);
    localStorage.setItem("user",  JSON.stringify(userData));
    localStorage.setItem("token", data.token);
    return userData;
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (name, email, password, role) => {
    const data = await authAPI.register(name, email, password, role);
    const userData = { ...data.user, token: data.token };
    setUser(userData);
    localStorage.setItem("user",  JSON.stringify(userData));
    localStorage.setItem("token", data.token);
    return userData;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
