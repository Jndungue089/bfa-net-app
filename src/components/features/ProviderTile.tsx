import { Image, Pressable, StyleSheet, View } from "react-native";
import { RECHARGE_PROVIDERS, type RechargeProvider } from "@bfa/shared";
import { T } from "@/components/ui";
import { PROVIDER_VISUALS } from "@/lib/providers";
import { colors, radius } from "@/theme";

export function ProviderTile({ provider, onPress }: { provider: RechargeProvider; onPress: () => void }) {
  const v = PROVIDER_VISUALS[provider];
  const info = RECHARGE_PROVIDERS[provider];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={info.label} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.75 }]}>
      <View style={[styles.logoBox, { backgroundColor: v.bg }]}><Image source={v.logo} style={{ width: "100%", height: "100%" }} resizeMode={v.fit} /></View>
      <T style={{ fontWeight: "600", textAlign: "center" }}>{info.label}</T>
    </Pressable>
  );
}

/** Small logo used in headers of the provider form. */
export function ProviderLogo({ provider, height = 56 }: { provider: RechargeProvider; height?: number }) {
  const v = PROVIDER_VISUALS[provider];
  return <View style={[styles.logoBox, { backgroundColor: v.bg, width: height * 1.7, height, borderWidth: 1, borderColor: colors.border }]}><Image source={v.logo} style={{ width: "100%", height: "100%" }} resizeMode={v.fit} /></View>;
}

const styles = StyleSheet.create({
  tile: { width: "48%", flexGrow: 0, backgroundColor: "#fff", borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 },
  logoBox: { borderRadius: radius.md, overflow: "hidden", aspectRatio: 1.7, alignItems: "center", justifyContent: "center" },
});
