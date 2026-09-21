import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme";

type Variant = "display" | "title" | "heading" | "body" | "label" | "caption";

export function T({ variant = "body", style, muted, color, ...rest }: TextProps & { variant?: Variant; muted?: boolean; color?: string }) {
  return <RNText allowFontScaling maxFontSizeMultiplier={1.4} style={[styles[variant], muted && { color: colors.muted }, color ? { color } : null, style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: { fontFamily: fonts.regular, fontSize: 34, fontWeight: "800", color: colors.navy900, fontVariant: ["tabular-nums"] },
  title: { fontFamily: fonts.regular, fontSize: 26, fontWeight: "700", color: colors.navy900 },
  heading: { fontFamily: fonts.regular, fontSize: 19, fontWeight: "600", color: colors.navy900 },
  body: { fontFamily: fonts.regular, fontSize: 16.5, color: colors.text },
  label: { fontFamily: fonts.regular, fontSize: 15, fontWeight: "500", color: "#334155" },
  caption: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.muted },
});
