import { useState } from "react";
import { View } from "react-native";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { applyFieldErrors, formatIban, formatMoney, isBfaIban, isValidIban, normalizeIban, transferSchema, type Receipt } from "@bfa/shared";
import { Button, FormMoney, FormPicker, FormText, Notice } from "@/components/ui";
import { useAccounts, useBeneficiaries, useResolveIban, useTransfer } from "@/hooks/useBank";
import { AccountPickerField } from "./AccountPickerField";
import { PinSheet } from "./PinSheet";
import { SummaryRows } from "./SummaryRows";

type In = z.input<typeof transferSchema>;
type Out = z.output<typeof transferSchema>;
const FIELDS = ["fromAccountId", "toIban", "beneficiaryName", "amount", "description"] as const;

export function TransferForm({ onDone, presetIban }: { onDone: (r: Receipt) => void; presetIban?: string }) {
  const accounts = useAccounts();
  const beneficiaries = useBeneficiaries();
  const transfer = useTransfer();
  const [pending, setPending] = useState<Out | null>(null);

  const { control, handleSubmit, setValue, setError } = useForm<In, unknown, Out>({
    resolver: zodResolver(transferSchema),
    defaultValues: { fromAccountId: "", toIban: presetIban ?? "", beneficiaryName: "", amount: "", description: "" },
  });

  const iban = normalizeIban(useWatch({ control, name: "toIban" }) ?? "");
  const ibanOk = isValidIban(iban);
  const resolved = useResolveIban(iban, ibanOk);
  const interbank = ibanOk && !isBfaIban(iban);

  const onSubmit = (v: Out) => {
    const from = accounts.data?.find((a) => a.id === v.fromAccountId);
    if (from && v.amount > from.balance) return setError("amount", { message: "Saldo insuficiente." });
    if (resolved.data && !resolved.data.valid) return setError("toIban", { message: "Conta de destino não encontrada." });
    transfer.reset();
    setPending(v);
  };

  const confirm = (pin: string) => {
    if (!pending) return;
    transfer.mutate(
      { fromAccountId: pending.fromAccountId, toIban: pending.toIban, beneficiaryName: pending.beneficiaryName || undefined, amount: pending.amount, description: pending.description || undefined, pin },
      {
        onSuccess: (r) => { setPending(null); onDone(r); },
        onError: (e) => { if (applyFieldErrors(e, setError, FIELDS)) setPending(null); },
      },
    );
  };

  const fieldErrors = (transfer.error as { fieldErrors?: object } | null)?.fieldErrors;
  return (
    <View style={{ gap: 16 }}>
      <AccountPickerField control={control} name="fromAccountId" accounts={accounts.data} onDefault={(id) => setValue("fromAccountId", id)} />
      {!!beneficiaries.data?.length && (
        <FormPicker control={control} name="toIban" label="Beneficiário guardado" placeholder="Outro destinatário…"
          options={beneficiaries.data.map((b) => ({ value: b.iban, label: b.name, sub: formatIban(b.iban) }))}
          onPick={(v) => { const b = beneficiaries.data?.find((x) => x.iban === v); setValue("beneficiaryName", b && !isBfaIban(b.iban) ? b.name : ""); }} />
      )}
      <FormText control={control} name="toIban" label="IBAN de destino" placeholder="AO06 …" autoCapitalize="characters" autoCorrect={false} autoComplete="off" />
      {ibanOk && resolved.data?.valid && resolved.data.internalAccount && <Notice kind="success">Titular: {resolved.data.holderMasked} · BFA · sem comissão</Notice>}
      {ibanOk && resolved.data && !resolved.data.valid && <Notice kind="error">Não existe nenhuma conta BFA com este IBAN.</Notice>}
      {interbank && <Notice kind="info">Transferência para outro banco: aplica-se uma comissão e o nome do beneficiário é obrigatório.</Notice>}
      {interbank && <FormText control={control} name="beneficiaryName" label="Nome do beneficiário" autoComplete="off" />}
      <FormMoney control={control} name="amount" label="Montante" />
      <FormText control={control} name="description" label="Descrição (opcional)" maxLength={140} />
      <Button title="Continuar" onPress={handleSubmit(onSubmit)} />

      <PinSheet visible={!!pending} pending={transfer.isPending} error={transfer.error && !fieldErrors ? transfer.error : null}
        onCancel={() => setPending(null)} onConfirm={confirm}
        summary={pending && <SummaryRows rows={[["Montante", formatMoney(pending.amount)], ["Para", pending.beneficiaryName || resolved.data?.holderMasked || ""], ["IBAN", formatIban(pending.toIban)], ["Comissão", isBfaIban(pending.toIban) ? "Sem comissão" : "Aplicável"], ["Descrição", pending.description]]} />} />
    </View>
  );
}
