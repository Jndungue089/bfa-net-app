import { useState } from "react";
import { View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  formatMoney, formatPhone, RECHARGE_PROVIDERS, rechargeSchema, servicePaymentSchema, statePaymentSchema, type Receipt, type RechargeProvider,
} from "@bfa/shared";
import { Button, FormMoney, FormText } from "@/components/ui";
import { useAccounts, usePayService, usePayState, useRecharge } from "@/hooks/useBank";
import { AccountPickerField } from "./AccountPickerField";
import { PinSheet } from "./PinSheet";
import { SummaryRows } from "./SummaryRows";

const digits = (max: number) => (v: string) => v.replace(/\D/g, "").slice(0, max);

type SIn = z.input<typeof servicePaymentSchema>;
type SOut = z.output<typeof servicePaymentSchema>;

/** Pagamento por referência: entidade (5) + referência (9). */
export function ServicePaymentForm({ onDone }: { onDone: (r: Receipt) => void }) {
  const accounts = useAccounts();
  const pay = usePayService();
  const [pending, setPending] = useState<SOut | null>(null);
  const { control, handleSubmit, setValue, setError } = useForm<SIn, unknown, SOut>({
    resolver: zodResolver(servicePaymentSchema), defaultValues: { fromAccountId: "", entityCode: "", reference: "", amount: "" },
  });
  const submit = (v: SOut) => {
    const from = accounts.data?.find((a) => a.id === v.fromAccountId);
    if (from && v.amount > from.balance) return setError("amount", { message: "Saldo insuficiente." });
    pay.reset(); setPending(v);
  };
  return (
    <View style={{ gap: 16 }}>
      <AccountPickerField control={control} name="fromAccountId" accounts={accounts.data} onDefault={(id) => setValue("fromAccountId", id)} />
      <FormText control={control} name="entityCode" label="Entidade" keyboardType="number-pad" sanitize={digits(5)} placeholder="5 dígitos" />
      <FormText control={control} name="reference" label="Referência" keyboardType="number-pad" sanitize={digits(9)} placeholder="9 dígitos" />
      <FormMoney control={control} name="amount" label="Montante" />
      <Button title="Continuar" onPress={handleSubmit(submit)} />
      <PinSheet visible={!!pending} pending={pay.isPending} error={pay.error} onCancel={() => setPending(null)}
        onConfirm={(pin) => pending && pay.mutate({ ...pending, pin }, { onSuccess: (r) => { setPending(null); onDone(r); } })}
        summary={pending && <SummaryRows rows={[["Montante", formatMoney(pending.amount)], ["Entidade", pending.entityCode], ["Referência", pending.reference]]} />} />
    </View>
  );
}

type StIn = z.input<typeof statePaymentSchema>;
type StOut = z.output<typeof statePaymentSchema>;

/** Pagamento ao Estado: referência de 13 dígitos. */
export function StatePaymentForm({ onDone }: { onDone: (r: Receipt) => void }) {
  const accounts = useAccounts();
  const pay = usePayState();
  const [pending, setPending] = useState<StOut | null>(null);
  const { control, handleSubmit, setValue, setError } = useForm<StIn, unknown, StOut>({
    resolver: zodResolver(statePaymentSchema), defaultValues: { fromAccountId: "", reference: "", amount: "" },
  });
  const submit = (v: StOut) => {
    const from = accounts.data?.find((a) => a.id === v.fromAccountId);
    if (from && v.amount > from.balance) return setError("amount", { message: "Saldo insuficiente." });
    pay.reset(); setPending(v);
  };
  return (
    <View style={{ gap: 16 }}>
      <AccountPickerField control={control} name="fromAccountId" accounts={accounts.data} onDefault={(id) => setValue("fromAccountId", id)} />
      <FormText control={control} name="reference" label="Referência de pagamento" keyboardType="number-pad" sanitize={digits(13)} placeholder="13 dígitos" hint="Consta no documento de arrecadação de receita." />
      <FormMoney control={control} name="amount" label="Montante" />
      <Button title="Continuar" onPress={handleSubmit(submit)} />
      <PinSheet visible={!!pending} pending={pay.isPending} error={pay.error} onCancel={() => setPending(null)}
        onConfirm={(pin) => pending && pay.mutate({ fromAccountId: pending.fromAccountId, reference: pending.reference, amount: pending.amount, pin }, { onSuccess: (r) => { setPending(null); onDone(r); } })}
        summary={pending && <SummaryRows rows={[["Montante", formatMoney(pending.amount)], ["Beneficiário", "Estado"], ["Referência", pending.reference]]} />} />
    </View>
  );
}

type RIn = z.input<typeof rechargeSchema>;
type ROut = z.output<typeof rechargeSchema>;

/** Carregamento / pagamento a um fornecedor: telemóvel (Unitel, Africell) ou nº de subscritor / contador (DStv, ZAP, ENDE). */
export function RechargeForm({ provider, onDone }: { provider: RechargeProvider; onDone: (r: Receipt) => void }) {
  const info = RECHARGE_PROVIDERS[provider];
  const accounts = useAccounts();
  const recharge = useRecharge();
  const [pending, setPending] = useState<ROut | null>(null);
  const { control, handleSubmit, setValue, setError } = useForm<RIn, unknown, ROut>({
    resolver: zodResolver(rechargeSchema), defaultValues: { fromAccountId: "", provider, identifier: "", amount: "" },
  });
  const mobile = info.kind === "mobile";
  const submit = (v: ROut) => {
    const from = accounts.data?.find((a) => a.id === v.fromAccountId);
    if (from && v.amount > from.balance) return setError("amount", { message: "Saldo insuficiente." });
    recharge.reset(); setPending(v);
  };
  return (
    <View style={{ gap: 16 }}>
      <AccountPickerField control={control} name="fromAccountId" accounts={accounts.data} onDefault={(id) => setValue("fromAccountId", id)} />
      <FormText control={control} name="identifier" label={info.idLabel} placeholder={info.idHint} keyboardType={mobile ? "phone-pad" : "number-pad"}
        sanitize={mobile ? (v) => v.replace(/[^\d+\s]/g, "").slice(0, 16) : digits(12)} />
      <FormMoney control={control} name="amount" label="Montante" hint={`Entre ${formatMoney(info.min).replace(",00", "")} e ${formatMoney(info.max).replace(",00", "")}`} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {info.quickAmounts.map((q) => <Button key={q} title={formatMoney(q).replace(",00", "").replace(" Kz", "")} variant="secondary" onPress={() => setValue("amount", String(q), { shouldValidate: true })} style={{ minHeight: 40, paddingHorizontal: 14 }} />)}
      </View>
      <Button title="Continuar" onPress={handleSubmit(submit)} />
      <PinSheet visible={!!pending} pending={recharge.isPending} error={recharge.error} onCancel={() => setPending(null)}
        onConfirm={(pin) => pending && recharge.mutate({ ...pending, pin }, { onSuccess: (r) => { setPending(null); onDone(r); } })}
        summary={pending && <SummaryRows rows={[["Montante", formatMoney(pending.amount)], ["Fornecedor", info.label], [info.idLabel, mobile ? formatPhone(pending.identifier.replace(/\D/g, "").slice(-9)) : pending.identifier]]} />} />
    </View>
  );
}

