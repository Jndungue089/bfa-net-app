import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { dateRangeSchema, formatDate, presetRange, statementPdfPath, type PeriodPreset } from "@bfa/shared";
import { StatementRow } from "@/components/features/StatementRow";
import { accountTypeLabel } from "@/components/features/labels";
import { Button, Card, FormText, Icon, Money, Notice, Screen, Skeleton, T, type IconName } from "@/components/ui";
import { useAccounts, useStatementRange } from "@/hooks/useBank";
import { shareBackendPdf } from "@/lib/receiptShare";
import { colors } from "@/theme";

type Mode = PeriodPreset | "custom";
const MODES: Array<{ id: Mode; label: string }> = [{ id: "month", label: "Este mês" }, { id: "30d", label: "30 dias" }, { id: "90d", label: "90 dias" }, { id: "custom", label: "Período" }];
type RangeIn = z.input<typeof dateRangeSchema>;

function Chip({ selected, label, icon, onPress }: { selected: boolean; label: string; icon?: IconName; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}
      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: selected ? colors.navy800 : "#fff", borderWidth: 1, borderColor: selected ? colors.navy800 : colors.border }}>
      {icon ? <Icon name={icon} size={16} color={selected ? "#fff" : colors.navy800} /> : null}
      <T style={{ color: selected ? "#fff" : colors.text, fontWeight: "600", fontSize: 14.5 }}>{label}</T>
    </Pressable>
  );
}

export default function StatementScreen() {
  const accounts = useAccounts();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("month");
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const account = accounts.data?.find((a) => a.id === accountId) ?? accounts.data?.find((a) => a.type === "Ordem") ?? accounts.data?.[0];
  const range = useMemo(() => (mode === "custom" ? custom : presetRange(mode)), [mode, custom]);
  const statement = useStatementRange(account?.id ?? "", range ?? {}, !!range);
  const items = statement.data?.items ?? [];
  const sum = items.reduce((acc, i) => (i.direction === "Credit" ? { ...acc, credits: acc.credits + i.amount } : { ...acc, debits: acc.debits + i.amount }), { credits: 0, debits: 0 });

  const { control, handleSubmit } = useForm<RangeIn>({ resolver: zodResolver(dateRangeSchema), defaultValues: { from: "", to: "" } });

  // The PDF is issued by the backend; the app only downloads and shares it.
  const exportPdf = async () => {
    if (!account || !range) return;
    setExporting(true); setExportError(null);
    try { await shareBackendPdf(statementPdfPath(account.id, range), `extracto-${range.from}_${range.to}`, "Extracto BFA NET"); }
    catch (e) {
      if (__DEV__) console.warn("Exportação do extracto falhou:", e);
      const msg = e instanceof Error ? e.message : "";
      setExportError(/status: 404/.test(msg) ? "Extracto indisponível. Se o servidor foi actualizado há pouco, reinicie o backend."
        : /status: 422/.test(msg) ? "Período inválido para o extracto."
        : `Não foi possível obter o extracto${msg ? `: ${msg}` : "."}`);
    } finally { setExporting(false); }
  };

  return (
    <Screen edges={[]}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityRole="radiogroup">
        {accounts.data?.map((a) => <Chip key={a.id} icon={a.type === "Poupanca" ? "wallet-outline" : "card-outline"} label={a.nickname ?? accountTypeLabel[a.type]} selected={account?.id === a.id} onPress={() => setAccountId(a.id)} />)}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {MODES.map((m) => <Chip key={m.id} icon={m.id === "custom" ? "calendar-outline" : undefined} label={m.label} selected={mode === m.id} onPress={() => setMode(m.id)} />)}
      </View>

      {mode === "custom" ? (
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}><FormText control={control} name="from" label="De" placeholder="AAAA-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} sanitize={(v) => v.replace(/[^\d-]/g, "")} /></View>
            <View style={{ flex: 1 }}><FormText control={control} name="to" label="Até" placeholder="AAAA-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} sanitize={(v) => v.replace(/[^\d-]/g, "")} /></View>
          </View>
          <Button title="Aplicar período" variant="secondary" onPress={handleSubmit((v) => setCustom({ from: v.from, to: v.to }))} />
        </Card>
      ) : null}

      {range ? <T variant="caption">{formatDate(`${range.from}T00:00:00Z`)} — {formatDate(`${range.to}T00:00:00Z`)}</T> : <Notice kind="info">Indique o período e toque em «Aplicar».</Notice>}

      <Card style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Icon name="arrow-down-circle" size={16} color={colors.success} /><T variant="caption">Entradas</T></View><Money value={sum.credits} style={{ fontWeight: "700", color: colors.success }} /></View>
        <View style={{ flex: 1, gap: 2 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Icon name="arrow-up-circle" size={16} color={colors.navy800} /><T variant="caption">Saídas</T></View><Money value={sum.debits} style={{ fontWeight: "700" }} /></View>
        <View style={{ width: 64, gap: 2 }}><T variant="caption">Movim.</T><T style={{ fontWeight: "700" }}>{items.length}</T></View>
      </Card>

      <Button title="Exportar PDF" loading={exporting} disabled={!account || !range} onPress={exportPdf} />
      {exportError ? <Notice kind="error">{exportError}</Notice> : null}
      {statement.data?.truncated ? <Notice kind="warning">Mostrados os 1000 movimentos mais recentes do período.</Notice> : null}

      <Card>
        {statement.isPending && range ? <Skeleton style={{ height: 120 }} /> : statement.isError ? <Notice kind="error">Não foi possível carregar o extracto.</Notice>
          : items.length === 0 ? <T variant="caption" style={{ textAlign: "center", paddingVertical: 16 }}>Sem movimentos no período.</T>
          : items.map((i, n) => <View key={i.entryId} style={n ? { borderTopWidth: 1, borderTopColor: colors.border } : undefined}><StatementRow item={i} /></View>)}
      </Card>
    </Screen>
  );
}
