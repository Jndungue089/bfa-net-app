import { Pressable, View } from "react-native";
import { FaceIcon, Icon, T } from "@/components/ui";
import type { BiometricInfo } from "@/hooks/useBiometricLogin";
import { colors, radius } from "@/theme";

export function BiometricGlyph({ kind, size = 26, color = colors.navy800 }: { kind: BiometricInfo["kind"]; size?: number; color?: string }) {
  return kind === "face" ? <FaceIcon size={size} color={color} /> : <Icon name="finger-print" size={size} color={color} />;
}

/** Large tap target on the login screen: the sensor glyph plus its platform name. */
export function BiometricButton({ info, loading, onPress }: { info: BiometricInfo; loading?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={loading} accessibilityRole="button" accessibilityLabel={`Entrar com ${info.label}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 56, borderRadius: radius.md, backgroundColor: colors.navy50, opacity: loading ? 0.5 : pressed ? 0.7 : 1 })}>
      <BiometricGlyph kind={info.kind} size={28} />
      <View><T style={{ fontWeight: "700", color: colors.navy800 }}>Entrar com {info.label}</T></View>
    </Pressable>
  );
}
