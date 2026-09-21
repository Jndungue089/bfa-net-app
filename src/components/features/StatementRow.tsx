import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { formatDateTime, type StatementItem } from "@bfa/shared";
import { Icon, Money, T } from "@/components/ui";
import { colors } from "@/theme";
import { kindIcon, kindLabel } from "./labels";

/** One movement. Tapping opens the transaction detail. */
export function StatementRow({ item }: { item: StatementItem }) {
  const router = useRouter();
  const credit = item.direction === "Credit";
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: item.transactionId } })} accessibilityRole="button"
      accessibilityLabel={`${item.counterparty ?? kindLabel[item.kind]}, ${credit ? "crédito" : "débito"}. Ver detalhes`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, opacity: pressed ? 0.6 : 1 })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: credit ? colors.successBg : "#F1F5F9" }}>
        <Icon name={kindIcon[item.kind]} size={20} color={credit ? colors.success : colors.navy800} />
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: "600" }} numberOfLines={1}>{item.counterparty ?? kindLabel[item.kind]}</T>
        <T variant="caption" numberOfLines={1}>{item.description ?? kindLabel[item.kind]} · {formatDateTime(item.createdAt)}</T>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Money value={credit ? item.amount : -item.amount} signed style={{ fontWeight: "700", color: credit ? colors.success : colors.text }} />
        <Money value={item.balanceAfter} variant="caption" />
      </View>
    </Pressable>
  );
}
