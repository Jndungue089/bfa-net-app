import { create } from "zustand";
import type { Profile } from "@bfa/shared";

/** booting → (locked | anonymous | authenticated). The access token lives in memory only. */
type Status = "booting" | "locked" | "anonymous" | "authenticated";

interface SessionState {
  status: Status;
  accessToken: string | null;
  profile: Profile | null;
  setAuthenticated: (accessToken: string, profile: Profile) => void;
  setAccessToken: (accessToken: string) => void;
  setProfile: (profile: Profile) => void;
  lock: () => void;
  setAnonymous: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "booting",
  accessToken: null,
  profile: null,
  setAuthenticated: (accessToken, profile) => set({ status: "authenticated", accessToken, profile }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setProfile: (profile) => set({ profile }),
  lock: () => set({ status: "locked", accessToken: null }),
  setAnonymous: () => set({ status: "anonymous", accessToken: null, profile: null }),
}));
