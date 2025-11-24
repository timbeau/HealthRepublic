// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, fetchMe, LoginResponse, MeResponse } from "../api/client";

type Role = "member" | "supplier" | "admin" | "unknown";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: MeResponse["user"] | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
    user: null,
    loading: false,
    error: null,
  });

  // On mount, if we have an access token, load /dashboard/me
  useEffect(() => {
    const init = async () => {
      if (!state.accessToken) return;
      try {
        setState((s) => ({ ...s, loading: true, error: null }));
        const me = await fetchMe(state.accessToken);
        setState((s) => ({ ...s, user: me.user, loading: false }));
      } catch (err) {
        console.error(err);
        // Token invalid; clear everything.
        setState({
          accessToken: null,
          refreshToken: null,
          user: null,
          loading: false,
          error: "Session expired. Please log in again.",
        });
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    };
    void init();
  }, []); // run once

  const handleLogin = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const tokens: LoginResponse = await apiLogin(email, password);

      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);

      const me = await fetchMe(tokens.access_token);

      setState({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user: me.user,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error(err);
      setState((s) => ({
        ...s,
        loading: false,
        error: err?.message || "Login failed",
      }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      loading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
