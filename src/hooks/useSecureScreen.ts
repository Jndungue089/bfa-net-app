import { Platform } from "react-native";
import { usePreventScreenCapture } from "expo-screen-capture";

/** Blocks screenshots / screen recording while mounted (Android FLAG_SECURE, iOS capture events). Native only. */
export const useSecureScreen: () => void = Platform.OS === "web" ? () => undefined : () => usePreventScreenCapture();
