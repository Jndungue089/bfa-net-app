import { Pressable, StyleSheet, View } from "react-native";
import { Icon, T, type IconName } from "@/components/ui";
import { colors, radius } from "@/theme";

/** Grid tile: big icon in a tinted circle + label. Two per row. */
export function ServiceTile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }]}>
      <View style={styles.circle}><Icon name={icon} size={28} color={colors.brandDark} /></View>
      <T style={styles.label} numberOfLines={2}>{label}</T>
    </Pressable>
  );
}

/** Row used on option lists (icon, title, optional subtitle, chevron). */
export function OptionRow({ icon, title, subtitle, onPress }: { icon: IconName; title: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.navy50 }]}>
      <View style={[styles.circle, { width: 46, height: 46, marginBottom: 0 }]}><Icon name={icon} size={22} color={colors.brandDark} /></View>
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: "600" }}>{title}</T>
        {subtitle ? <T variant="caption">{subtitle}</T> : null}
      </View>
      <Icon name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: "48%", flexGrow: 0, backgroundColor: "#fff", borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, minHeight: 124, justifyContent: "space-between" },
  circle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandFaint, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  label: { fontWeight: "600", fontSize: 15.5, lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 4, borderRadius: radius.md },
});
