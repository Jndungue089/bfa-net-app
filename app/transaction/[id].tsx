import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { receiptRows } from "@/components/features/ReceiptView";
import { SummaryRows } from "@/components/features/SummaryRows";
import { kindIcon, kindLabel } from "@/components/features/labels";
import { Card, Icon, IconButton, Money, Notice, Screen, Skeleton, T } from "@/components/ui";
import { useTransaction } from "@/hooks/useBank";
import { useShareReceipt } from "@/hooks/useShareReceipt";
import { colors } from "@/theme";

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tx = useTransaction(id);
  const receipt = useShareReceipt();

  if (tx.isPending) return <Screen edges={[]}><Skeleton style={{ height: 300, borderRadius: 20 }} /></Screen>;
  if (tx.isError || !tx.data) return <Screen edges={[]}><Notice kind="error">Não foi possível carregar a transacção.</Notice></Screen>;

  const r = tx.data;
  const credit = r.direction === "Credit";
  const ok = r.status === "Completed";

  return (
    <Screen edges={[]}>
      <Card style={{ alignItems: "center", gap: 10 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: credit ? colors.successBg : colors.navy50, alignItems: "center", justifyContent: "center" }}>
          <Icon name={kindIcon[r.kind]} size={30} color={credit ? colors.success : colors.navy800} />
        </View>
        <T variant="caption">{kindLabel[r.kind]}</T>
        <Money value={r.amount} currency={r.currency} always variant="display" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name={ok ? "checkmark-circle" : "alert-circle"} size={18} color={ok ? colors.success : colors.danger} />
          <T style={{ color: ok ? colors.success : colors.danger, fontWeight: "600" }}>{ok ? "Concluída" : r.status === "Reversed" ? "Revertida" : "Falhada"}</T>
        </View>
      </Card>

      <Card>
        <SummaryRows rows={receiptRows(r).filter(([k]) => k !== "Tipo" && k !== "Referência")} />
      </Card>

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <T variant="caption">REFERÊNCIA</T>
          <T selectable style={{ fontWeight: "600" }}>{r.reference}</T>
        </View>
        <IconButton icon="share-social-outline" label="Partilhar comprovativo" onPress={() => void receipt.share(r)} disabled={receipt.pending} background={colors.navy50} />
      </Card>
      {receipt.error ? <Notice kind="error">{receipt.error}</Notice> : null}
    </Screen>
  );
}
