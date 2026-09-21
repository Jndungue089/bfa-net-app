import { View } from "react-native";
import { useRouter } from "expo-router";
import type { Insight, InsightKind } from "@bfa/shared";
import { Button, Icon, T, type IconName } from "@/components/ui";
import { usePrivacyStore } from "@/stores/privacy";
import { colors } from "@/theme";

const LOOK: Record<InsightKind, { icon: IconName; bg: string; fg: string; label: string }> = {
  success: { icon: "checkmark-circle-outline", bg: colors.successBg, fg: colors.success, label: "Bom sinal" },
  info: { icon: "information-circle-outline", bg: colors.navy50, fg: colors.navy700, label: "Informação" },
  warning: { icon: "warning-outline", bg: colors.warningBg, fg: colors.warning, label: "Atenção" },
  tip: { icon: "bulb-outline", bg: colors.brandLight, fg: colors.brandDark, label: "Sugestão" },
};

export function InsightRow({ insight, onSave, onCredit }: { insight: Insight; onSave: () => void; onCredit: () => void }) {
  const look = LOOK[insight.kind];
  const router = useRouter();
  const hide = usePrivacyStore((s) => s.hide);
  return (
    <View style={{ flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: look.bg, alignItems: "center", justifyContent: "center" }}><Icon name={look.icon} color={look.fg} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="caption" style={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: 11.5 }}>{look.label}</T>
        <T variant="heading" style={{ fontSize: 17 }}>{insight.title}</T>
        <T variant="caption" color={colors.text}>{hide ? "Mensagem oculta (modo privacidade)." : insight.message}</T>
        {insight.actionType === "save" && <Button title="Poupar agora" onPress={onSave} style={{ marginTop: 8 }} />}
        {insight.actionType === "credit" && <Button title="Ver oferta" variant="secondary" onPress={onCredit} style={{ marginTop: 8 }} />}
        {insight.actionType === "statement" && <Button title="Ver extracto" variant="secondary" onPress={() => router.push("/statement")} style={{ marginTop: 8 }} />}
      </View>
    </View>
  );
}
