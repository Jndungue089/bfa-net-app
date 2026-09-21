import { StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme";
import { T } from "./Text";

const tones = {
  error: { bg: colors.dangerBg, fg: colors.danger }, success: { bg: colors.successBg, fg: colors.success },
  info: { bg: colors.navy50, fg: colors.navy800 }, warning: { bg: colors.warningBg, fg: colors.warning },
} as const;

export function Notice({ kind = "info", children }: { kind?: keyof typeof tones; children: React.ReactNode }) {
  const t = tones[kind];
  return (
    <View accessibilityRole={kind === "error" ? "alert" : undefined} style={[styles.box, { backgroundColor: t.bg }]}>
      <T style={{ color: t.fg, fontSize: 14 }}>{children}</T>
    </View>
  );
}

const styles = StyleSheet.create({ box: { padding: 12, borderRadius: radius.md } });
