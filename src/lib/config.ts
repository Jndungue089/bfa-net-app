import { Platform } from "react-native";

// Android emulators reach the host machine at 10.0.2.2. For a physical device set EXPO_PUBLIC_API_URL to the LAN address.
const fallback = Platform.OS === "android" ? "http://10.0.2.2:5080" : "http://localhost:5080";
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? fallback).replace(/\/$/, "");

// Release builds must never talk to the bank over cleartext HTTP.
if (!__DEV__ && !API_URL.startsWith("https://")) throw new Error("EXPO_PUBLIC_API_URL deve usar HTTPS em produção.");

export const USER_AGENT = `BFANET-Mobile/1.0 (${Platform.OS})`;
/** Lock (require biometrics again) when the app has been in the background this long. */
export const LOCK_AFTER_MS = 60_000;
