import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from "react-native";
import { colors, radius } from "@/theme";
import { T } from "./Text";

type Variant = "primary" | "secondary" | "danger" | "ghost";
const bg: Record<Variant, string> = { primary: colors.brand, secondary: "#fff", danger: colors.danger, ghost: "transparent" };
const fg: Record<Variant, string> = { primary: "#fff", secondary: colors.navy800, danger: "#fff", ghost: colors.navy800 };

export function Button({ title, variant = "primary", loading, disabled, style, ...rest }: Omit<PressableProps, "children"> & { title: string; variant?: Variant; loading?: boolean }) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled: !!off, busy: !!loading }} disabled={off}
      style={(s) => [styles.base, { backgroundColor: bg[variant], opacity: off ? 0.55 : s.pressed ? 0.85 : 1 }, variant === "secondary" && styles.outline, typeof style === "function" ? style(s) : style]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg[variant]} /> : <T style={{ color: fg[variant], fontWeight: "700", fontSize: 16.5 }}>{title}</T>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  outline: { borderWidth: 1, borderColor: colors.border },
});
