import { Pressable, StyleSheet, type ColorValue } from "react-native";
import { colors, radius } from "@/theme";
import { Icon, type IconName } from "./Icon";

/** Icon-only button. `label` is mandatory: it is the accessible name (there is no visible text). */
export function IconButton({ icon, label, onPress, color = colors.navy800, background, size = 22, disabled }: {
  icon: IconName; label: string; onPress: () => void; color?: ColorValue; background?: ColorValue; size?: number; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}
      style={({ pressed }) => [styles.base, background ? { backgroundColor: background } : null, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({ base: { width: 44, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" } });
