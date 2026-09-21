import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bfanet.bio.token";
const META_KEY = "bfanet.bio.meta";
const PIN_KEY = "bfanet.bio.pin";
const PREFS_KEY = "bfanet.bio.prefs";

export interface BiometricPrefs { enabled: boolean; purchases: boolean }

/**
 * Biometric login credential.
 *  - The device token is stored with `requireAuthentication`: the OS itself demands Face ID / Touch ID /
 *    fingerprint (or passcode) to *read* it, and it is only kept on devices that have a passcode set.
 *  - Which customer it belongs to is not secret and lives in a separate item, so the login screen can decide
 *    whether to offer biometrics without triggering a prompt.
 */
export const biometricStore = {
  async customerNumber(): Promise<string | null> {
    try {
      const raw = await SecureStore.getItemAsync(META_KEY);
      const n = raw ? (JSON.parse(raw) as { customerNumber?: unknown }).customerNumber : null;
      return typeof n === "string" && /^\d{8}$/.test(n) ? n : null;
    } catch { return null; }
  },

  async enable(customerNumber: string, deviceToken: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, deviceToken, {
      requireAuthentication: true, authenticationPrompt: "Confirme para activar o login biométrico",
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    });
    await SecureStore.setItemAsync(META_KEY, JSON.stringify({ customerNumber }), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  },

  /** Triggers the OS biometric prompt. Returns null if cancelled/invalidated (e.g. fingerprints changed). */
  async readToken(prompt: string): Promise<string | null> {
    try { return await SecureStore.getItemAsync(TOKEN_KEY, { requireAuthentication: true, authenticationPrompt: prompt }); }
    catch { return null; }
  },

  // ---- user preferences (not secret, no prompt) ----

  /** Master switch + "confirm payments with biometrics". Devices enrolled before prefs existed count as enabled. */
  async prefs(): Promise<BiometricPrefs> {
    try {
      const raw = await SecureStore.getItemAsync(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<BiometricPrefs>;
        return { enabled: p.enabled === true, purchases: p.enabled === true && p.purchases === true };
      }
    } catch { /* fall through to the default */ }
    return { enabled: (await biometricStore.customerNumber()) !== null, purchases: false };
  },

  async setPrefs(p: BiometricPrefs): Promise<void> {
    await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(p), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  },

  // ---- operations PIN, released only by the OS biometric prompt ----

  async storePin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_KEY, pin, {
      requireAuthentication: true, authenticationPrompt: "Confirme para activar pagamentos com biometria",
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    });
  },

  /** Triggers the OS biometric prompt. Null when cancelled, or when the key was invalidated (biometrics changed). */
  async readPin(prompt: string): Promise<string | null> {
    try { return await SecureStore.getItemAsync(PIN_KEY, { requireAuthentication: true, authenticationPrompt: prompt }); }
    catch { return null; }
  },

  async clearPin(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_KEY, { requireAuthentication: false }).catch(() => undefined);
    const p = await biometricStore.prefs();
    if (p.purchases) await biometricStore.setPrefs({ ...p, purchases: false });
  },

  /** Login credential only (see clearPin for the payment PIN). */
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY, { requireAuthentication: false }).catch(() => undefined);
    await SecureStore.deleteItemAsync(META_KEY).catch(() => undefined);
  },
};
