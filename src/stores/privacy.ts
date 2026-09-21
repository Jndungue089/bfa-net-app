import { create } from "zustand";

/** "Ocultar saldos" — in-memory only; balances are visible again on every fresh launch. */
export const usePrivacyStore = create<{ hide: boolean; toggle: () => void }>((set) => ({
  hide: false,
  toggle: () => set((s) => ({ hide: !s.hide })),
}));
