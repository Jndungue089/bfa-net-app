import * as SecureStore from "expo-secure-store";

const REFRESH_KEY = "bfanet.refresh";
// Keychain / Keystore, readable only while the device is unlocked, never migrated to another device or backups.
const opts: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const refreshTokenStore = {
  get: () => SecureStore.getItemAsync(REFRESH_KEY, opts).catch(() => null),
  set: (token: string) => SecureStore.setItemAsync(REFRESH_KEY, token, opts),
  clear: () => SecureStore.deleteItemAsync(REFRESH_KEY, opts).catch(() => undefined),
};
