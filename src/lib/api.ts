import { createApiClient, createBankApi } from "@bfa/shared";
import { API_URL, USER_AGENT } from "./config";
import { queryClient } from "./queryClient";
import { refreshTokenStore } from "./secureStorage";
import { purgeShareFiles } from "./pdfShare";
import { useSessionStore } from "@/stores/session";

/** Persist a fresh session: refresh token to the Keychain/Keystore, access token to memory. */
export async function storeSession(accessToken: string, refreshToken: string) {
  await refreshTokenStore.set(refreshToken);
  useSessionStore.getState().setAccessToken(accessToken);
}

export async function endSession() {
  purgeShareFiles(); // no statements/receipts left behind
  await refreshTokenStore.clear();
  useSessionStore.getState().setAnonymous();
  queryClient.clear(); // drop cached financial data
}

/** Rotates the session with the stored refresh token. True when a fresh access token is in memory. */
export async function refreshSession(): Promise<boolean> {
  const token = await refreshTokenStore.get();
  if (!token) return false;
  try {
    const s = await bankApi.auth.refresh(token);
    if (!s.accessToken || !s.refreshToken) return false;
    await storeSession(s.accessToken, s.refreshToken);
    return true;
  } catch {
    return false;
  }
}

const client = createApiClient({
  baseUrl: API_URL,
  clientKind: "mobile",
  userAgent: USER_AGENT,
  getAccessToken: () => useSessionStore.getState().accessToken,
  refresh: refreshSession,
  onSessionExpired: () => { void endSession(); },
});

export const bankApi = createBankApi(client);
