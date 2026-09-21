import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@bfa/shared";
import { bankApi } from "@/lib/api";
import { biometricStore, type BiometricPrefs } from "@/lib/biometricStore";
import { authenticate } from "./useBiometrics";
import { type BiometricInfo, useBiometricInfo } from "./useBiometricLogin";

const PREFS = ["biometric-prefs"] as const;
const ENROLLED = ["biometric-enrolled"] as const;

const cancelled = () => new ApiError(0, "cancelled", "Autenticação biométrica cancelada.");

export const useBiometricPrefs = () => useQuery({ queryKey: PREFS, queryFn: () => biometricStore.prefs(), staleTime: Infinity });

function useRefresh() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: PREFS }), qc.invalidateQueries({ queryKey: ENROLLED })]);
}

/** Master switch. Off = login credential revoked + payment PIN forgotten; On = one OS biometric confirmation. */
export function useToggleBiometrics(label: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (on: boolean) => {
      if (on) {
        if (!(await authenticate(`Confirme com ${label}`))) throw cancelled();
        await biometricStore.setPrefs({ ...(await biometricStore.prefs()), enabled: true });
        return;
      }
      if ((await biometricStore.customerNumber()) !== null) {
        const token = await biometricStore.readToken(`Confirme com ${label} para desactivar`);
        if (token) await bankApi.auth.biometricDisable(token).catch(() => undefined); // server-side revoke; local removal is what matters
        await biometricStore.clear();
      }
      await biometricStore.clearPin();
      await biometricStore.setPrefs({ enabled: false, purchases: false });
    },
    onSettled: refresh,
  });
}

/** "Confirmar pagamentos com biometria": proves the PIN to the server once, then keeps it behind the sensor. */
export function useTogglePurchases(label: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (v: { on: true; pin: string } | { on: false }) => {
      if (!v.on) { await biometricStore.clearPin(); await biometricStore.setPrefs({ ...(await biometricStore.prefs()), purchases: false }); return; }
      if (!(await authenticate(`Confirme com ${label}`))) throw cancelled();
      await bankApi.auth.verifyPin(v.pin); // wrong PIN → 422 (counts towards the normal PIN lockout)
      await biometricStore.storePin(v.pin);
      await biometricStore.setPrefs({ enabled: true, purchases: true });
    },
    onSettled: refresh,
  });
}

export interface PurchaseBiometrics {
  /** Enabled in settings AND supported right now. */
  ready: boolean;
  info: BiometricInfo | null;
  /** OS biometric prompt → the stored PIN, or null (cancelled / key invalidated). */
  unlock: () => Promise<string | null>;
  /** Drop the stored PIN (it stopped being valid, e.g. the PIN was changed elsewhere). */
  forget: () => Promise<void>;
}

/** Used by the PIN sheet to offer "confirm with Face ID / fingerprint" instead of typing the PIN. */
export function usePurchaseBiometrics(): PurchaseBiometrics {
  const info = useBiometricInfo();
  const prefs = useBiometricPrefs();
  const refresh = useRefresh();
  return {
    ready: !!info?.available && !!prefs.data?.enabled && !!prefs.data.purchases,
    info,
    unlock: async () => {
      if (!info) return null;
      return biometricStore.readPin(`Confirmar operação com ${info.label}`);
    },
    forget: async () => { await biometricStore.clearPin(); await refresh(); },
  };
}
