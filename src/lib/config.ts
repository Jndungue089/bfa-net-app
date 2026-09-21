import { Platform } from "react-native";

// Deployed API. Override with EXPO_PUBLIC_API_URL to develop against a local backend
// (Android emulator: http://10.0.2.2:5080 · iOS simulator: http://localhost:5080 · phone: http://<LAN-IP>:5080).
const DEFAULT_API_URL = "https://bfa-api.josemarsilva.me";
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");

// Release builds must never talk to the bank over cleartext HTTP.
if (!__DEV__ && !API_URL.startsWith("https://")) throw new Error("EXPO_PUBLIC_API_URL deve usar HTTPS em produção.");

export const USER_AGENT = `BFANET-Mobile/1.0 (${Platform.OS})`;
/** Lock (require biometrics again) when the app has been in the background this long. */
export const LOCK_AFTER_MS = 60_000;
