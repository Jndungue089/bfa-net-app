import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Card } from "@bfa/shared";
import { Icon, T } from "@/components/ui";

const GRADIENTS: Record<Card["product"], readonly [string, string, string]> = {
  // BFA's physical debit cards are the primary brand colour (orange); the secondary navy is used for prepaid.
  Debito: ["#F7844A", "#F05D1A", "#B33C08"],
  PrePago: ["#1B2C85", "#0D1B5E", "#070D36"],
  Credito: ["#2B2B2B", "#141414", "#000000"],
};
const PRODUCT_LABEL: Record<Card["product"], string> = { Debito: "DÉBITO", PrePago: "PRÉ-PAGO", Credito: "CRÉDITO" };

/** ISO/IEC 7810 ID-1 proportions (85.6 × 54 mm). Never shows more than the last 4 digits. */
export function BankCard({ card }: { card: Card }) {
  const blocked = card.status === "Blocked";
  const expiry = `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}`;
  return (
    <View style={styles.shadow} accessible accessibilityLabel={`Cartão ${PRODUCT_LABEL[card.product].toLowerCase()} terminado em ${card.last4}${blocked ? ", bloqueado" : ""}`}>
      <LinearGradient colors={blocked ? ["#8A94A6", "#5B6474", "#3F4653"] : GRADIENTS[card.product]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={[styles.orb, { top: -70, right: -50, width: 220, height: 220 }]} />
        <View style={[styles.orb, { bottom: -90, left: -60, width: 240, height: 240, opacity: 0.05 }]} />

        <View style={styles.row}>
          <View style={styles.logoPill}><Image source={require("../../../assets/logo-mark.png")} style={{ width: 62, height: 24 }} resizeMode="contain" /></View>
          <T style={styles.product}>{PRODUCT_LABEL[card.product]}</T>
        </View>

        <View style={[styles.row, { marginTop: 18 }]}>
          <LinearGradient colors={["#F5D77A", "#C9A24B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
            <View style={styles.chipLine} /><View style={[styles.chipLine, { top: 22 }]} /><View style={styles.chipVertical} />
          </LinearGradient>
          <View style={{ transform: [{ rotate: "90deg" }] }}><Icon name="wifi" size={26} color="rgba(255,255,255,0.85)" /></View>
        </View>

        <T style={styles.number}>•••• •••• •••• {card.last4}</T>

        <View style={[styles.row, { alignItems: "flex-end" }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <T style={styles.tiny}>TITULAR</T>
            <T style={styles.holder} numberOfLines={1}>{card.holderName}</T>
          </View>
          <View>
            <T style={styles.tiny}>VALIDADE</T>
            <T style={styles.holder}>{expiry}</T>
          </View>
        </View>

        {blocked ? (
          <View style={styles.blocked}><Icon name="lock-closed" size={34} color="#fff" /></View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: 22, shadowColor: "#070D36", shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  card: { aspectRatio: 1.586, borderRadius: 22, padding: 20, overflow: "hidden", justifyContent: "space-between" },
  orb: { position: "absolute", borderRadius: 999, backgroundColor: "#fff", opacity: 0.08 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoPill: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  product: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700", letterSpacing: 2 },
  chip: { width: 46, height: 36, borderRadius: 7, overflow: "hidden" },
  chipLine: { position: "absolute", left: 0, right: 0, top: 11, height: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  chipVertical: { position: "absolute", top: 0, bottom: 0, left: 22, width: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  number: { color: "#fff", fontSize: 21, letterSpacing: 3, fontWeight: "600", fontVariant: ["tabular-nums"] },
  tiny: { color: "rgba(255,255,255,0.6)", fontSize: 9.5, letterSpacing: 1.5 },
  holder: { color: "#fff", fontSize: 15, fontWeight: "600", letterSpacing: 1 },
  blocked: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.35)", alignItems: "center", justifyContent: "center" },
});
