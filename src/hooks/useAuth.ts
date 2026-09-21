import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bankApi, endSession, storeSession } from "@/lib/api";
import { biometricStore } from "@/lib/biometricStore";
import { refreshTokenStore } from "@/lib/secureStorage";
import { useSessionStore } from "@/stores/session";

export function useLogin() {
  return useMutation({
    mutationFn: (v: { customerNumber: string; password: string }) => bankApi.auth.login(v),
    onSuccess: async (s) => {
      if (!s.accessToken || !s.refreshToken) throw new Error("Resposta de sessão inválida.");
      await storeSession(s.accessToken, s.refreshToken);
      useSessionStore.getState().setAuthenticated(s.accessToken, s.profile);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = await refreshTokenStore.get();
      await bankApi.auth.logout(token ?? undefined).catch(() => undefined); // always end the local session
    },
    onSettled: async () => { await endSession(); qc.clear(); },
  });
}

export const useChangePassword = () => useMutation({ mutationFn: bankApi.auth.changePassword });
export function useChangePin() {
  return useMutation({
    mutationFn: bankApi.auth.changePin,
    // The PIN kept behind the biometric sensor is now stale.
    onSuccess: () => biometricStore.clearPin(),
  });
}
export const useSessions = () => useQuery({ queryKey: ["sessions"], queryFn: () => bankApi.auth.sessions() });
