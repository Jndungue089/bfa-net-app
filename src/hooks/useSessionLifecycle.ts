import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { bankApi, endSession, storeSession } from "@/lib/api";
import { LOCK_AFTER_MS } from "@/lib/config";
import { purgeShareFiles } from "@/lib/pdfShare";
import { refreshTokenStore } from "@/lib/secureStorage";
import { useSessionStore } from "@/stores/session";
import { authenticate, canAuthenticate } from "./useBiometrics";

/** Restores a session from the Keychain/Keystore (behind biometrics when available). */
export async function resumeSession(): Promise<boolean> {
  const token = await refreshTokenStore.get();
  if (!token) return false;
  try {
    const s = await bankApi.auth.refresh(token);
    if (!s.accessToken || !s.refreshToken) return false;
    await storeSession(s.accessToken, s.refreshToken);
    useSessionStore.getState().setAuthenticated(s.accessToken, s.profile);
    return true;
  } catch (e) {
    // A definitive rejection means the token is dead; a network failure keeps it for the next attempt.
    if ((e as { status?: number }).status && (e as { status: number }).status >= 400) await endSession();
    return false;
  }
}

/** First launch: no stored token → login; stored token → lock screen (biometric) instead of silently signing in. */
export function useBootstrap() {
  useEffect(() => {
    purgeShareFiles(); // leftovers from a previous run
    void (async () => {
      const token = await refreshTokenStore.get();
      if (!token) return useSessionStore.getState().setAnonymous();
      if (await canAuthenticate()) useSessionStore.setState({ status: "locked" });
      else if (!(await resumeSession())) useSessionStore.getState().setAnonymous();
    })();
  }, []);
}

/** Locks after LOCK_AFTER_MS in the background: the in-memory access token is discarded and biometrics are required again. */
export function useAutoLock() {
  const leftAt = useRef<number | null>(null);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      const { status, lock } = useSessionStore.getState();
      if (state === "background") leftAt.current = Date.now();
      if (state === "active" && leftAt.current && status === "authenticated" && Date.now() - leftAt.current > LOCK_AFTER_MS) lock();
      if (state === "active") leftAt.current = null;
    });
    return () => sub.remove();
  }, []);
}

export { authenticate };
