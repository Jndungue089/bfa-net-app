import { useState } from "react";
import { View } from "react-native";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { applyFieldErrors, formatMoney, formatPhone, kwikSchema, normalizePhone, RX, type Receipt } from "@bfa/shared";
import { Button, FormMoney, FormText, Notice } from "@/components/ui";
import { useAccounts, useKwikTransfer, useResolveKwik } from "@/hooks/useBank";
import { AccountPickerField } from "./AccountPickerField";
import { PinSheet } from "./PinSheet";
import { SummaryRows } from "./SummaryRows";

type In = z.input<typeof kwikSchema>;
type Out = z.output<typeof kwikSchema>;
const FIELDS = ["fromAccountId", "key", "amount", "description"] as const;

/** Instant transfer to a mobile number (chave KWiK). `initial` comes from a scanned QR. */
export function KwikForm({ initial, onDone }: { initial?: { key?: string; amount?: number; name?: string }; onDone: (r: Receipt) => void }) {
  const accounts = useAccounts();
  const kwik = useKwikTransfer();
  const [pending, setPending] = useState<Out | null>(null);
  const { control, handleSubmit, setValue, setError } = useForm<In, unknown, Out>({
    resolver: zodResolver(kwikSchema),
    defaultValues: { fromAccountId: "", key: initial?.key ?? "", amount: initial?.amount ? String(initial.amount).replace(".", ",") : "", description: "" },
  });

  const key = normalizePhone(useWatch({ control, name: "key" }) ?? "");
  const keyOk = RX.phone.test(key);
  const resolved = useResolveKwik(key, keyOk);

  const submit = (v: Out) => {
    const from = accounts.data?.find((a) => a.id === v.fromAccountId);
    if (from && v.amount > from.balance) return setError("amount", { message: "Saldo insuficiente." });
    if (resolved.data && !resolved.data.found) return setError("key", { message: "Chave KWiK não encontrada." });
    kwik.reset(); setPending(v);
  };
  const fieldErrors = kwik.error && (kwik.error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  const hasField = !!fieldErrors && Object.keys(fieldErrors).length > 0;

  return (
    <View style={{ gap: 16 }}>
      <AccountPickerField control={control} name="fromAccountId" accounts={accounts.data} onDefault={(id) => setValue("fromAccountId", id)} />
      <FormText control={control} name="key" label="Chave KWiK" hint="Número de telemóvel do destinatário" keyboardType="phone-pad" placeholder="9XX XXX XXX" sanitize={(v) => v.replace(/[^\d+\s]/g, "").slice(0, 16)} />
      {initial?.name ? <Notice kind="info">Indicado no QR: {initial.name} (não verificado)</Notice> : null}
      {keyOk && resolved.data?.found ? <Notice kind="success">Titular: {resolved.data.holderMasked}</Notice> : null}
      {keyOk && resolved.data && !resolved.data.found ? <Notice kind="error">Nenhum cliente BFA com esta chave KWiK.</Notice> : null}
      <FormMoney control={control} name="amount" label="Montante" />
      <FormText control={control} name="description" label="Descrição (opcional)" maxLength={140} />
      <Button title="Continuar" onPress={handleSubmit(submit)} />
      <PinSheet visible={!!pending} pending={kwik.isPending} error={kwik.error && !hasField ? kwik.error : null} onCancel={() => setPending(null)}
        onConfirm={(pin) => pending && kwik.mutate({ fromAccountId: pending.fromAccountId, key: pending.key, amount: pending.amount, description: pending.description || undefined, pin }, {
          onSuccess: (r) => { setPending(null); onDone(r); }, onError: (e) => { if (applyFieldErrors(e, setError, FIELDS)) setPending(null); },
        })}
        summary={pending && <SummaryRows rows={[["Montante", formatMoney(pending.amount)], ["Para", resolved.data?.holderMasked ?? ""], ["Chave KWiK", formatPhone(pending.key)], ["Descrição", pending.description]]} />} />
    </View>
  );
}
