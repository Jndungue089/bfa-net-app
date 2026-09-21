import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { formatIban, type Account } from "@bfa/shared";
import { Icon, Money, T } from "@/components/ui";
import { usePrivacyStore } from "@/stores/privacy";
import { colors } from "@/theme";
import { accountTypeLabel } from "./labels";

/** Balance as a hero panel: big figure, account chip, and the hide-balances switch right where the number is. */
export function BalancePanel({ account }: { account: Account }) {
  const { hide, toggle } = usePrivacyStore();
  return (
    <LinearGradient colors={["#1B2C85", "#0D1B5E", "#070D36"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.panel}>
      <View style={[styles.orb, { top: -60, right: -30, width: 190, height: 190, backgroundColor: colors.brand, opacity: 0.22 }]} />
      <View style={[styles.orb, { bottom: -80, left: 20, width: 200, height: 200, backgroundColor: "#fff", opacity: 0.05 }]} />
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flex: 1, gap: 8 }}>
          <T style={{ color: "rgba(255,255,255,0.72)", fontSize: 14.5, fontWeight: "600", letterSpacing: 0.4 }}>Saldo disponível</T>
          <Money value={account.balance} currency={account.currency} style={{ color: "#fff", fontSize: 36, fontWeight: "800", lineHeight: 40 }} />
        </View>
        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={hide ? "Mostrar saldos" : "Ocultar saldos"} hitSlop={8}
          style={({ pressed }) => [styles.eye, pressed && { opacity: 0.7 }]}>
          <Icon name={hide ? "eye-off-outline" : "eye-outline"} size={22} color="#fff" />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
        <View style={styles.chip}>
          <Icon name="card-outline" size={16} color="#fff" />
          <T style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{account.nickname ?? accountTypeLabel[account.type]}</T>
        </View>
        <T style={{ color: "rgba(255,255,255,0.7)", fontSize: 13.5 }}>{formatIban(account.iban)}</T>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 24, padding: 20, overflow: "hidden" },
  orb: { position: "absolute", borderRadius: 999 },
  eye: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
