import { useState } from "react";
import { View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatIban, formatMoney, isBfaIban, moneyField, type QrPayload, type Receipt } from "@bfa/shared";
import { Button, FormMoney, Notice, T } from "@/components/ui";
import { useAccounts, useResolveIban, useTransfer } from "@/hooks/useBank";
import { AccountPickerField } from "./AccountPickerField";
import { PinSheet } from "./PinSheet";
import { SummaryRows } from "./SummaryRows";

const schema = z.object({ fromAccountId: z.uuid("Seleccione a conta de origem."), amount: moneyField() });
type In = z.input<typeof schema>;
type Out = z.output<typeof schema>;

/** Pays a merchant from a scanned BFAPAY QR. Merchant name in the QR is only a label; the server-resolved holder is what is verified. */
export function QrPurchaseForm({ payload, onDone }: { payload: Extract<QrPayload, { kind: "pay" }>; onDone: (r: Receipt) => void }) {
  const accounts = useAccounts();
  const transfer = useTransfer();
  const resolved = useResolveIban(payload.iban, true);
  const [pending, setPending] = useState<Out | null>(null);
  const fixed = payload.amount !== undefined;
  const { control, handleSubmit, setValue, setError } = useForm<In, unknown, Out>({
    resolver: zodResolver(schema), defaultValues: { fromAccountId: "", amount: fixed ? String(payload.amount).replace(".", ",") : "" },
  });

  const submit = (v: Out) => {
    const from = accounts.data?.find((a) => a.id === v.fromAccountId);
    if (from && v.amount > from.balance) return setError("amount", { message: "Saldo insuficiente." });
    transfer.reset(); setPending(v);
  };
  const merchant = payload.name ?? "Comerciante";
  const description = `Compra - ${merchant}${payload.ref ? ` (${payload.ref})` : ""}`.slice(0, 140);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <T variant="heading">{merchant}</T>
        <T variant="caption">{formatIban(payload.iban)}</T>
        {payload.ref ? <T variant="caption">Ref.: {payload.ref}</T> : null}
      </View>
      {resolved.data?.valid && resolved.data.internalAccount ? <Notice kind="success">Titular verificado: {resolved.data.holderMasked}</Notice> : null}
      {resolved.data && !resolved.data.valid ? <Notice kind="error">Conta de destino inexistente. Não pague este QR.</Notice> : null}
      {resolved.data?.valid && !resolved.data.internalAccount ? <Notice kind="warning">Conta noutro banco: é aplicada comissão e o titular não pode ser verificado.</Notice> : null}
      <AccountPickerField control={control} name="fromAccountId" accounts={accounts.data} onDefault={(id) => setValue("fromAccountId", id)} />
      {fixed ? <View><T variant="caption">Montante</T><T variant="display">{formatMoney(payload.amount!)}</T></View> : <FormMoney control={control} name="amount" label="Montante" />}
      <Button title="Pagar" disabled={resolved.data ? !resolved.data.valid : false} onPress={handleSubmit(submit)} />
      <PinSheet visible={!!pending} pending={transfer.isPending} error={transfer.error} onCancel={() => setPending(null)}
        onConfirm={(pin) => pending && transfer.mutate({
          fromAccountId: pending.fromAccountId, toIban: payload.iban, beneficiaryName: isBfaIban(payload.iban) ? undefined : merchant,
          amount: pending.amount, description, pin,
        }, { onSuccess: (r) => { setPending(null); onDone(r); } })}
        summary={pending && <SummaryRows rows={[["Montante", formatMoney(pending.amount)], ["Comerciante", merchant], ["Titular", resolved.data?.holderMasked ?? ""], ["IBAN", formatIban(payload.iban)]]} />} />
    </View>
  );
}
