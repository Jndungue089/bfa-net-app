import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { formatDate, formatMoney, makeCreditSchema, parseMoneyInput, type CreditOffer, type Loan } from "@bfa/shared";
import { Button, Card, FormMoney, FormPicker, Icon, Notice, Skeleton, T } from "@/components/ui";
import { useAcceptCredit, useAccounts, useCreditOffer, useCreditSimulation, useRepayLoan } from "@/hooks/useBank";
import { usePrivacyStore } from "@/stores/privacy";
import { colors } from "@/theme";
import { accountTypeLabel } from "../labels";
import { PinSheet } from "../PinSheet";
import { SummaryRows } from "../SummaryRows";
import { SERIES } from "./HealthMeter";

const round1000 = (n: number) => Math.max(0, Math.round(n / 1000) * 1000);
const short = (n: number) => formatMoney(n).replace(",00", "");
const day = (iso: string) => formatDate(`${iso}T00:00:00Z`);

function Chip({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 999, justifyContent: "center", backgroundColor: selected ? colors.navy800 : "#fff", borderWidth: 1, borderColor: selected ? colors.navy800 : colors.border }}>
      <T style={{ color: selected ? "#fff" : colors.text, fontWeight: "600" }}>{label}</T>
    </Pressable>
  );
}

export function CreditPanel() {
  const offer = useCreditOffer();
  return (
    <Card style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Icon name="cash-outline" color={colors.brand} /><T variant="heading">Microcrédito pré-aprovado</T></View>
      {offer.isPending ? <Skeleton style={{ height: 160, borderRadius: 14 }} /> : offer.isError ? <Notice kind="error">Não foi possível carregar a oferta.</Notice>
        : offer.data.activeLoan ? <LoanView loan={offer.data.activeLoan} /> : offer.data.eligible ? <Simulator offer={offer.data} /> : <NotEligible offer={offer.data} />}
    </Card>
  );
}

function NotEligible({ offer }: { offer: CreditOffer }) {
  return (
    <View style={{ gap: 10 }}>
      <T variant="caption">Ainda não há uma oferta para si. O assistente explica sempre porquê — e o que falta:</T>
      {offer.blockers.map((b) => <View key={b} style={{ flexDirection: "row", gap: 8 }}><Icon name="warning-outline" size={18} color={colors.warning} /><T variant="caption" color={colors.text} style={{ flex: 1 }}>{b}</T></View>)}
      {offer.reasons.map((r) => <View key={r} style={{ flexDirection: "row", gap: 8 }}><Icon name="checkmark-circle-outline" size={18} color={colors.success} /><T variant="caption" style={{ flex: 1 }}>{r}</T></View>)}
    </View>
  );
}

type In = { accountId: string; amount: string; months: number };
type Out = z.output<ReturnType<typeof makeCreditSchema>>;

function Simulator({ offer }: { offer: CreditOffer }) {
  const accounts = useAccounts();
  const accept = useAcceptCredit();
  const hide = usePrivacyStore((s) => s.hide);
  const schema = useMemo(() => makeCreditSchema(offer), [offer]);
  const [pending, setPending] = useState<Out | null>(null);
  const [done, setDone] = useState<Loan | null>(null);
  const initialMonths = offer.terms.includes(6) ? 6 : offer.terms[0]!;
  const { control, handleSubmit, setValue } = useForm<In, unknown, Out>({ resolver: zodResolver(schema), defaultValues: { accountId: "", amount: String(round1000(offer.maxAmount / 2)), months: initialMonths } });
  const amountText = useWatch({ control, name: "amount" }) ?? "";
  const months = useWatch({ control, name: "months" }) ?? initialMonths;
  const amount = parseMoneyInput(amountText);
  const inRange = Number.isFinite(amount) && amount >= offer.minAmount && amount <= offer.maxAmount;
  const sim = useCreditSimulation(amount, months, inRange);
  const s = inRange ? sim.data : undefined;
  const receiving = (accounts.data ?? []).filter((a) => a.status === "Active" && a.type !== "Poupanca");

  if (done) return <Notice kind="success">{`Microcrédito de ${formatMoney(done.principal)} creditado. A 1.ª prestação de ${formatMoney(done.installment)} vence a ${day(done.installments[0]!.dueDate)}.`}</Notice>;

  return (
    <View style={{ gap: 14 }}>
      <View>
        <T variant="caption">Pode pedir até</T>
        <T variant="display">{hide ? "•••••• Kz" : short(offer.maxAmount)}</T>
        <T variant="caption">{`${offer.annualRatePercent}% ao ano · comissão de ${offer.originationFeePercent}%`}</T>
      </View>

      <FormMoney control={control} name="amount" label="Montante" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[0.25, 0.5, 0.75, 1].map((f) => <Chip key={f} label={`${f * 100}%`} selected={round1000(offer.maxAmount * f) === amount} onPress={() => { accept.reset(); setValue("amount", String(round1000(offer.maxAmount * f)), { shouldValidate: true }); }} />)}
      </View>
      <View style={{ gap: 6 }}>
        <T variant="label">Prazo</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{offer.terms.map((t) => <Chip key={t} label={`${t} meses`} selected={months === t} onPress={() => { accept.reset(); setValue("months", t, { shouldValidate: true }); }} />)}</View>
      </View>

      <View style={{ backgroundColor: colors.navy50, borderRadius: 16, padding: 14, gap: 6, opacity: sim.isFetching ? 0.6 : 1 }} accessibilityLiveRegion="polite">
        {!s ? <T variant="caption">{`Indique um montante entre ${short(offer.minAmount)} e ${short(offer.maxAmount)}.`}</T> : (
          <>
            <T variant="caption">Prestação mensal</T>
            <T variant="display" style={{ fontSize: 30 }}>{hide ? "•••••• Kz" : formatMoney(s.installment)}</T>
            <SummaryRows rows={[["Total a pagar", hide ? "••••" : short(s.totalRepayable)], ["Juros", hide ? "••••" : short(s.totalInterest)], ["Comissão", hide ? "••••" : short(s.fee)], ["Recebe na conta", hide ? "••••" : short(s.netDisbursed)]]} />
            {!s.withinCapacity && <Notice kind="warning">A prestação excede a sua capacidade de pagamento. Escolha um prazo mais longo ou um montante menor.</Notice>}
          </>
        )}
      </View>

      <FormPicker control={control} name="accountId" label="Receber na conta" options={receiving.map((a) => ({ value: a.id, label: a.nickname ?? accountTypeLabel[a.type], sub: formatMoney(a.balance, a.currency) }))} />
      <Button title="Pedir microcrédito" disabled={!s || !s.withinCapacity} onPress={handleSubmit((v) => { accept.reset(); setPending(v); })} />
      <T variant="caption" style={{ fontSize: 12.5 }}>Simulação de demonstração: análise automática sobre os seus movimentos, não constitui aconselhamento financeiro. O valor só é creditado depois de confirmar com o PIN.</T>

      <PinSheet visible={!!pending} pending={accept.isPending} error={accept.error} onCancel={() => setPending(null)}
        onConfirm={(pin) => pending && accept.mutate({ accountId: pending.accountId, amount: pending.amount, months: pending.months, pin }, { onSuccess: (l) => { setPending(null); setDone(l); } })}
        summary={pending && s ? <SummaryRows rows={[["Montante", formatMoney(pending.amount)], ["Prazo", `${pending.months} meses`], ["Prestação", formatMoney(s.installment)], ["Taxa", `${s.annualRatePercent}% ao ano`], ["Comissão", formatMoney(s.fee)], ["Recebe", formatMoney(s.netDisbursed)]]} /> : null} />
    </View>
  );
}

function LoanView({ loan }: { loan: Loan }) {
  const accounts = useAccounts();
  const repay = useRepayLoan(loan.id);
  const hide = usePrivacyStore((s) => s.hide);
  const [asking, setAsking] = useState(false);
  const [picked, setPicked] = useState("");
  const [paid, setPaid] = useState<string | null>(null);
  const [plan, setPlan] = useState(false);
  const paidCount = loan.installments.filter((i) => i.paidAt).length;
  const next = loan.installments.find((i) => !i.paidAt);
  const eligible = (accounts.data ?? []).filter((a) => a.status === "Active" && a.type !== "Poupanca");
  const account = picked || eligible[0]?.id || "";
  const from = eligible.find((a) => a.id === account);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <View><T variant="caption">Em dívida</T><T variant="display" style={{ fontSize: 30 }}>{hide ? "•••••• Kz" : formatMoney(loan.outstanding)}</T></View>
        <T variant="caption">{paidCount}/{loan.termMonths} prestações</T>
      </View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: loan.termMonths, now: paidCount }} style={{ height: 10, borderRadius: 5, backgroundColor: "#E2E8F0" }}>
        <View style={{ width: `${(paidCount / loan.termMonths) * 100}%`, height: 10, borderRadius: 5, backgroundColor: SERIES }} />
      </View>
      {paid ? <Notice kind="success">{paid}</Notice> : null}
      {next && (
        <View style={{ backgroundColor: colors.navy50, borderRadius: 16, padding: 14, gap: 10 }}>
          <View><T variant="caption">{`Próxima prestação · ${day(next.dueDate)}`}</T><T variant="heading">{hide ? "•••••• Kz" : formatMoney(next.amount)}</T></View>
          <Button title="Pagar prestação" onPress={() => { repay.reset(); setAsking(true); }} />
        </View>
      )}
      <Pressable onPress={() => setPlan((p) => !p)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
        <T color={colors.navy700} style={{ fontWeight: "600" }}>{plan ? "Esconder plano de pagamento" : "Ver plano de pagamento"}</T>
      </Pressable>
      {plan && loan.installments.map((i) => (
        <View key={i.number} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Icon name={i.paidAt ? "checkmark-circle" : "ellipse-outline"} size={18} color={i.paidAt ? colors.success : colors.placeholder} /><T variant="caption" color={colors.text}>{`${i.number}. ${day(i.dueDate)}`}</T></View>
          <T variant="caption">{hide ? "••••" : short(i.amount)}</T>
        </View>
      ))}

      <PinSheet visible={asking} pending={repay.isPending} error={repay.error} onCancel={() => setAsking(false)}
        onConfirm={(pin) => repay.mutate({ fromAccountId: account, pin }, { onSuccess: (r) => { setAsking(false); setPaid(`Prestação paga (${formatMoney(r.amount)}). Referência ${r.reference}.`); } })}
        summary={
          <View style={{ gap: 10 }}>
            <SummaryRows rows={[["Prestação", next ? formatMoney(next.amount) : ""], ["Vencimento", next ? day(next.dueDate) : ""], ["Debitar de", from ? `${from.nickname ?? accountTypeLabel[from.type]} · ${formatMoney(from.balance, from.currency)}` : ""]]} />
            {eligible.length > 1 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{eligible.map((a) => <Chip key={a.id} label={a.nickname ?? accountTypeLabel[a.type]} selected={a.id === account} onPress={() => setPicked(a.id)} />)}</View>
            )}
          </View>
        } />
    </View>
  );
}
