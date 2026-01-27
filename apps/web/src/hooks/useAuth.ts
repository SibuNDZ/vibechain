"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string | null;
  username: string;
  walletAddress: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const TOKEN_KEY = "vibechain_token";

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      setState((prev) => ({ ...prev, token }));
      fetchUser(token);
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const user = await api.get<User>("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      // Token is invalid, clear it
      localStorage.removeItem(TOKEN_KEY);
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<{ access_token: string }>("/auth/login", {
        email,
        password,
      });

      const { access_token } = response;
      localStorage.setItem(TOKEN_KEY, access_token);

      await fetchUser(access_token);
      router.push("/videos");
    },
    [router]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const response = await api.post<{ access_token: string }>(
        "/auth/register",
        {
          username,
          email,
          password,
        }
      );

      const { access_token } = response;
      localStorage.setItem(TOKEN_KEY, access_token);

      await fetchUser(access_token);
      router.push("/videos");
    },
    [router]
  );

  const walletLogin = useCallback(
    async (walletAddress: string, signature: string, nonce: string) => {
      const response = await api.post<{ access_token: string }>(
        "/auth/wallet",
        {
          walletAddress,
          signature,
          nonce,
        }
      );

      const { access_token } = response;
      localStorage.setItem(TOKEN_KEY, access_token);

      await fetchUser(access_token);
      router.push("/videos");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
    router.push("/");
  }, [router]);

  return {
    ...state,
    login,
    register,
    walletLogin,
    logout,
  };
}

// Helper to get token for API calls
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
