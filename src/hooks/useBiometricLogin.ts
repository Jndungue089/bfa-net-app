import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@bfa/shared";
import { bankApi, storeSession } from "@/lib/api";
import { biometricStore } from "@/lib/biometricStore";
import { useSessionStore } from "@/stores/session";
import { authenticate } from "./useBiometrics";

const { AuthenticationType } = LocalAuthentication;

export interface BiometricInfo {
  available: boolean;
  /** "face" → Face ID / facial recognition, "fingerprint" → Touch ID / impressão digital. */
  kind: "face" | "fingerprint" | "other";
  label: string;
}

/** Names the sensor the way the platform does: Face ID / Touch ID on iOS, generic terms on Android. */
export function describeBiometrics(types: LocalAuthentication.AuthenticationType[], os: string = Platform.OS): Omit<BiometricInfo, "available"> {
  const face = types.includes(AuthenticationType.FACIAL_RECOGNITION);
  const finger = types.includes(AuthenticationType.FINGERPRINT);
  if (os === "ios") {
    if (face) return { kind: "face", label: "Face ID" };
    if (finger) return { kind: "fingerprint", label: "Touch ID" };
  } else {
    if (finger && !face) return { kind: "fingerprint", label: "impressão digital" };
    if (face && !finger) return { kind: "face", label: "reconhecimento facial" };
    if (finger && face) return { kind: "fingerprint", label: "biometria" };
  }
  return { kind: "other", label: "biometria" };
}

/** What this device can do (hardware present AND at least one biometric enrolled). */
export function useBiometricInfo(): BiometricInfo | null {
  const [info, setInfo] = useState<BiometricInfo | null>(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const available = (await LocalAuthentication.hasHardwareAsync().catch(() => false)) && (await LocalAuthentication.isEnrolledAsync().catch(() => false));
      const types = available ? await LocalAuthentication.supportedAuthenticationTypesAsync().catch(() => []) : [];
      if (alive) setInfo({ available, ...describeBiometrics(types) });
    })();
    return () => { alive = false; };
  }, []);
  return info;
}

/** Customer number this device is enrolled for, or null. Reading it never prompts. */
export const useEnrolledCustomer = () => useQuery({ queryKey: ["biometric-enrolled"], queryFn: () => biometricStore.customerNumber(), staleTime: Infinity });

export function useBiometricLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (label: string) => {
      const customerNumber = await biometricStore.customerNumber();
      if (!customerNumber) throw new ApiError(0, "not_enrolled", "O login biométrico não está activo neste dispositivo.");
      const token = await biometricStore.readToken(`Entrar no BFA NET com ${label}`);
      if (!token) throw new ApiError(0, "cancelled", "Autenticação biométrica cancelada.");
      try {
        return await bankApi.auth.biometricLogin({ customerNumber, deviceToken: token });
      } catch (e) {
        // The server no longer honours this credential (password changed, revoked): forget it locally too.
        if (e instanceof ApiError && e.status === 401) { await biometricStore.clear(); await qc.invalidateQueries({ queryKey: ["biometric-enrolled"] }); }
        throw e;
      }
    },
    onSuccess: async (s) => {
      if (!s.accessToken || !s.refreshToken) throw new Error("Resposta de sessão inválida.");
      await storeSession(s.accessToken, s.refreshToken);
      useSessionStore.getState().setAuthenticated(s.accessToken, s.profile);
    },
  });
}

/** Enrolling proves the password again (server side) and asks the OS for a biometric confirmation first. */
export function useEnableBiometric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { password: string; label: string }) => {
      const customerNumber = useSessionStore.getState().profile?.customerNumber;
      if (!customerNumber) throw new ApiError(401, "unauthorized", "Sessão inválida.");
      if (!(await authenticate(`Confirme com ${v.label}`))) throw new ApiError(0, "cancelled", "Autenticação biométrica cancelada.");
      const { deviceToken } = await bankApi.auth.biometricEnroll({ password: v.password });
      await biometricStore.enable(customerNumber, deviceToken);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["biometric-enrolled"] }),
  });
}

export function useDisableBiometric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (label: string) => {
      const token = await biometricStore.readToken(`Confirme com ${label} para desactivar`);
      if (token) await bankApi.auth.biometricDisable(token).catch(() => undefined); // server revokes it; local removal is what matters
      await biometricStore.clear();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["biometric-enrolled"] }),
  });
}
