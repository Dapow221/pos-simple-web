import { create } from "zustand";
import type { ApiUser } from "@/lib/api";

interface AuthState {
  user: ApiUser | null;
  accessToken: string | null;
  setSession: (user: ApiUser, accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken }),
  clearSession: () => set({ user: null, accessToken: null }),
}));
