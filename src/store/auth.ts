import { create } from "zustand";
import type { AuthUser } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null }),
}));
