import { useRef, useState } from "react";
import { View, type ScrollView } from "react-native";
import { formatMoney, formatDate, type Receipt } from "@bfa/shared";
import { CreditPanel } from "@/components/features/assistant/CreditPanel";
import { HealthMeter } from "@/components/features/assistant/HealthMeter";
import { InsightRow } from "@/components/features/assistant/InsightRow";
import { SaveSheet } from "@/components/features/assistant/SaveSheet";
import { CategoryBars, IncomeSpendBars } from "@/components/features/assistant/SpendCharts";
import { Button, Card, Icon, Money, Notice, Screen, Skeleton, T } from "@/components/ui";
import { useInsights } from "@/hooks/useBank";
import { usePrivacyStore } from "@/stores/privacy";
import { colors } from "@/theme";

function Kpi({ icon, label, hint, children }: { icon: React.ComponentProps<typeof Icon>["name"]; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card style={{ flexGrow: 1, flexBasis: 150, padding: 14, gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Icon name={icon} size={16} color={colors.muted} /><T variant="caption">{label}</T></View>
      {children}
      {hint ? <T variant="caption" style={{ fontSize: 12.5 }}>{hint}</T> : null}
    </Card>
  );
}

export default function AssistantScreen() {
  const q = useInsights();
  const hide = usePrivacyStore((s) => s.hide);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Receipt | null>(null);
  const [creditY, setCreditY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const d = q.data;

  return (
    <Screen scrollRef={scrollRef} onRefresh={() => void q.refetch()} refreshing={q.isRefetching}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><T variant="title" style={{ flexShrink: 1 }}>Assistente financeiro</T><Icon name="sparkles" color={colors.brand} size={24} /></View>
      <T variant="caption">Análise dos seus movimentos, actualizada a cada visita.</T>

      {q.isError ? <Notice kind="error">Não foi possível analisar os seus movimentos agora.</Notice> : null}
      {saved ? <Notice kind="success">{`Poupou ${formatMoney(saved.amount)}. Referência ${saved.reference}.`}</Notice> : null}

      {q.isPending ? <Skeleton style={{ height: 260, borderRadius: 20 }} /> : d ? (
        <>
          <Card style={{ gap: 12 }}><T variant="heading">Saúde financeira</T><HealthMeter health={d.health} /></Card>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <Kpi icon="arrow-up-outline" label="Gasto este mês" hint={`Previsão: ${hide ? "••••" : formatMoney(d.projectedSpend).replace(",00", "")}`}><Money value={d.spentThisMonth} variant="heading" /></Kpi>
            <Kpi icon="calendar-outline" label="Pode gastar por dia" hint={`${d.daysLeft} dias até ao fim do mês`}><Money value={d.dailyBudget} variant="heading" /></Kpi>
            <Kpi icon="trending-up-outline" label="Taxa de poupança" hint="Rendimento − gastos, em média"><T variant="heading">{d.savingsRatePercent.toFixed(0)}%</T></Kpi>
          </View>

          <T variant="heading">Para si</T>
          <View style={{ gap: 12 }}>{d.insights.map((i) => <InsightRow key={i.id} insight={i} onSave={() => setSaving(true)} onCredit={() => scrollRef.current?.scrollTo({ y: creditY, animated: true })} />)}</View>

          {d.saving ? (
            <Card style={{ backgroundColor: colors.brandFaint, borderColor: colors.brandLight, gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Icon name="wallet-outline" size={18} color={colors.brandDark} /><T variant="label" color={colors.brandDark}>Poupança sugerida</T></View>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}><Money value={d.saving.amount} variant="display" always /><T variant="caption">/ mês</T></View>
              <T variant="caption">{`${hide ? "••••" : formatMoney(d.saving.yearlyProjection).replace(",00", "")} num ano`}</T>
              {d.saving.targetIban ? <Button title="Poupar agora" onPress={() => setSaving(true)} style={{ marginTop: 8 }} /> : <T variant="caption">Ainda não tem uma conta poupança. Abra uma num balcão BFA para guardar automaticamente.</T>}
            </Card>
          ) : null}

          <Card style={{ gap: 12 }}><T variant="heading">Rendimento e gastos</T><IncomeSpendBars months={d.months} /></Card>
          <Card style={{ gap: 12 }}><T variant="heading">Para onde vai o dinheiro (este mês)</T><CategoryBars categories={d.categories} /></Card>

          {d.recurring.length > 0 ? (
            <Card style={{ gap: 10 }}>
              <T variant="heading">Pagamentos recorrentes</T>
              {d.recurring.map((r) => (
                <View key={r.name} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy50, alignItems: "center", justifyContent: "center" }}><Icon name="repeat-outline" size={18} color={colors.navy700} /></View>
                  <View style={{ flex: 1 }}><T numberOfLines={1} style={{ fontWeight: "600" }}>{r.name}</T><T variant="caption">{`${r.categoryLabel} · próximo a ${formatDate(`${r.nextDate}T00:00:00Z`)}`}</T></View>
                  <Money value={r.amount} style={{ fontWeight: "600" }} />
                </View>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}

      <View onLayout={(e) => setCreditY(e.nativeEvent.layout.y)}><CreditPanel /></View>
      <T variant="caption" style={{ textAlign: "center", fontSize: 12.5 }}>Estatística automática sobre os seus próprios movimentos — não usa inteligência artificial nem constitui aconselhamento financeiro. Projecto de demonstração.</T>
      {d?.saving ? <SaveSheet suggestion={d.saving} visible={saving} onClose={() => setSaving(false)} onDone={setSaved} /> : null}
    </Screen>
  );
}
