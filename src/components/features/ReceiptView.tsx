import { View } from "react-native";
import { formatDateTime, formatIban, type Receipt } from "@bfa/shared";
import { Button, Card, Icon, IconButton, Money, Notice, T } from "@/components/ui";
import { useShareReceipt } from "@/hooks/useShareReceipt";
import { colors } from "@/theme";
import { kindLabel } from "./labels";
import { SummaryRows } from "./SummaryRows";

/** Detail rows shared by the post-operation receipt and the transaction-detail screen. */
export function receiptRows(r: Receipt): Array<[string, React.ReactNode]> {
  const incoming = r.direction === "Credit";
  return [
    ["Tipo", kindLabel[r.kind]],
    [incoming ? "De" : "Para", incoming ? r.originatorName : r.counterpartyName],
    ["IBAN", !incoming && r.counterpartyIban ? formatIban(r.counterpartyIban) : null],
    ["Descrição", r.description],
    ["Comissão", r.fee > 0 ? <Money key="f" value={r.fee} always style={{ fontWeight: "600" }} /> : null],
    ["Saldo após", <Money key="b" value={r.balanceAfter} currency={r.currency} style={{ fontWeight: "600" }} />],
    ["Data", formatDateTime(r.createdAt)],
    ["Referência", r.reference],
  ];
}

export function ReceiptView({ receipt, onDone, extra }: { receipt: Receipt; onDone: () => void; extra?: React.ReactNode }) {
  const pdf = useShareReceipt();
  return (
    <Card style={{ gap: 16, alignItems: "center" }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successBg, alignItems: "center", justifyContent: "center" }}>
        <Icon name="checkmark-circle" size={44} color={colors.success} />
      </View>
      <T variant="heading">Operação concluída</T>
      <Money value={receipt.amount} currency={receipt.currency} always variant="display" />
      <View style={{ alignSelf: "stretch", backgroundColor: "#F8FAFC", borderRadius: 14, padding: 14 }}><SummaryRows rows={receiptRows(receipt)} /></View>
      {extra}
      {pdf.error ? <Notice kind="error">{pdf.error}</Notice> : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "stretch" }}>
        <IconButton icon="share-social-outline" label="Partilhar comprovativo" onPress={() => void pdf.share(receipt)} disabled={pdf.pending} background={colors.navy50} />
        <Button title="Concluir" onPress={onDone} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}
