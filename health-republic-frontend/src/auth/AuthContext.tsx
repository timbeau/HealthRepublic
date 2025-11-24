// src/auth/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, fetchMe } from "../api/client";
import type { LoginResponse, MeResponse } from "../api/client";


interface AuthContextValue {
  user: MeResponse["user"] | null;
  accessToken: string | null;
  isLoadingProfile: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  const navigate = useNavigate();

  // On first load, see if there's a token in localStorage and hydrate user
  useEffect(() => {
    const storedAccess = localStorage.getItem("access_token");
    if (!storedAccess) {
      setIsLoadingProfile(false);
      return;
    }

    setAccessToken(storedAccess);

    fetchMe(storedAccess)
      .then((me) => {
        setUser(me.user);
      })
      .catch((err) => {
        console.error("Failed to fetch profile on startup:", err);
        // if token is bad, clear it out
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoadingProfile(true);

    const tokens: LoginResponse = await apiLogin(email, password);

    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);

    setAccessToken(tokens.access_token);

    try {
      const me = await fetchMe(tokens.access_token);
      setUser(me.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to fetch profile after login:", err);
      // on error, just clear everything
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setAccessToken(null);
      setUser(null);
      throw err;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value: AuthContextValue = {
    user,
    accessToken,
    isLoadingProfile,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
