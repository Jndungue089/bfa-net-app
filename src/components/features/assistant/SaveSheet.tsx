import { formatIban, formatMoney, type Receipt, type SavingsSuggestion } from "@bfa/shared";
import { T } from "@/components/ui";
import { useTransfer } from "@/hooks/useBank";
import { PinSheet } from "../PinSheet";
import { SummaryRows } from "../SummaryRows";

/** "Poupar agora": an ordinary, PIN-confirmed transfer from the current account to the customer's own savings account. */
export function SaveSheet({ suggestion, visible, onClose, onDone }: { suggestion: SavingsSuggestion; visible: boolean; onClose: () => void; onDone: (r: Receipt) => void }) {
  const transfer = useTransfer();
  const { fromAccountId, targetIban, amount } = suggestion;
  return (
    <PinSheet
      visible={visible && !!fromAccountId && !!targetIban} pending={transfer.isPending} error={transfer.error}
      onCancel={() => { transfer.reset(); onClose(); }}
      onConfirm={(pin) => fromAccountId && targetIban && transfer.mutate({ fromAccountId, toIban: targetIban, amount, description: "Poupança automática", pin }, { onSuccess: (r) => { onClose(); onDone(r); } })}
      summary={<SummaryRows rows={[["Montante", <T key="a" style={{ fontWeight: "700" }}>{formatMoney(amount)}</T>], ["Para", "A sua conta poupança"], ["IBAN", targetIban ? formatIban(targetIban) : ""], ["Comissão", "Sem comissão"]]} />}
    />
  );
}
