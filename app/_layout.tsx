import "@/lib/polyfills";
import { Image, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { queryClient } from "@/lib/queryClient";
import { useAutoLock, useBootstrap } from "@/hooks/useSessionLifecycle";
import { useSessionStore } from "@/stores/session";
import { colors, fonts } from "@/theme";

const HEADER = { headerTintColor: colors.navy800, headerBackTitle: "Voltar", headerShadowVisible: false, headerStyle: { backgroundColor: colors.bg }, headerTitleStyle: { fontFamily: fonts.regular, fontWeight: "700" as const, fontSize: 19 } };
const SCREENS: Array<[string, string]> = [
  ["account/[id]", "Conta"], ["beneficiaries", "Beneficiários"], ["security", "Segurança"], ["biometrics", "Biometria"], ["statement", "Extracto bancário"],
  ["transaction/[id]", "Detalhes"], ["about", "Sobre o BFA"], ["contacts", "Contactos"],
];

/** Covers the UI while the app is inactive so balances never show in the OS app switcher. */
function PrivacyCurtain() {
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setCovered(s !== "active"));
    return () => sub.remove();
  }, []);
  if (!covered) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.curtain]} pointerEvents="none">
      <Image source={require("../assets/logo-mark.png")} style={{ width: 200, height: 78 }} resizeMode="contain" />
    </View>
  );
}

export default function RootLayout() {
  useBootstrap();
  useAutoLock();
  const status = useSessionStore((s) => s.status);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        {status === "booting" ? (
          <View style={styles.curtain}><Image source={require("../assets/logo-mark.png")} style={{ width: 200, height: 78 }} resizeMode="contain" /></View>
        ) : (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Protected guard={status === "authenticated"}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="pay" />
              {SCREENS.map(([name, title]) => <Stack.Screen key={name} name={name} options={{ headerShown: true, title, ...HEADER }} />)}
            </Stack.Protected>
            <Stack.Protected guard={status !== "authenticated"}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        )}
        <PrivacyCurtain />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ curtain: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" } });
