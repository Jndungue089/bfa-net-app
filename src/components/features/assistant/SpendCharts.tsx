import { View } from "react-native";
import { formatMoney, monthShort, type CategorySpend, type MonthFlow } from "@bfa/shared";
import { T } from "@/components/ui";
import { usePrivacyStore } from "@/stores/privacy";
import { colors } from "@/theme";
import { SERIES } from "./HealthMeter";

const INCOME = SERIES, SPEND = "#F05D1A"; // validated two-series pair
const short = (n: number) => formatMoney(n).replace(",00", "");
const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(".", ",")} M` : n >= 1000 ? `${Math.round(n / 1000)} mil` : String(Math.round(n)));

function Dot({ color, label }: { color: string; label: string }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} /><T variant="caption" color={colors.text}>{label}</T></View>;
}

/** Grouped bars per month, values labelled on the bars (no hover on touch), legend on top. */
export function IncomeSpendBars({ months }: { months: MonthFlow[] }) {
  const hide = usePrivacyStore((s) => s.hide);
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.spend]));
  const H = 130;
  const h = (v: number) => Math.max(v > 0 ? 3 : 0, Math.round((v / max) * H));
  return (
    <View accessible accessibilityLabel={hide ? "Gráfico de rendimento e gastos oculto" : months.map((m) => `${monthShort(m.month)}: rendimento ${short(m.income)}, gastos ${short(m.spend)}`).join(". ")}>
      <View style={{ flexDirection: "row", gap: 18, marginBottom: 12 }}><Dot color={INCOME} label="Rendimento" /><Dot color={SPEND} label="Gastos" /></View>
      <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: H + 18, borderBottomWidth: 1, borderBottomColor: "#CBD5E1" }}>
        {months.map((m) => (
          <View key={m.month} style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
            {[[m.income, INCOME], [m.spend, SPEND]].map(([v, c]) => (
              <View key={c as string} style={{ alignItems: "center", width: 30 }}>
                {!hide && <T variant="caption" style={{ fontSize: 10.5, color: colors.text }} numberOfLines={1}>{compact(v as number)}</T>}
                <View style={{ width: 20, height: h(v as number), backgroundColor: c as string, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 4 }}>{months.map((m) => <T key={m.month} variant="caption" style={{ width: 64, textAlign: "center" }}>{monthShort(m.month)}</T>)}</View>
    </View>
  );
}

/** Ranked bars in one hue; the tick marks the average of the previous months. */
export function CategoryBars({ categories }: { categories: CategorySpend[] }) {
  const hide = usePrivacyStore((s) => s.hide);
  const rows = categories.filter((c) => c.amount > 0 || c.averageBefore > 0).slice(0, 7);
  const max = Math.max(1, ...rows.flatMap((c) => [c.amount, c.averageBefore]));
  if (rows.length === 0) return <T variant="caption" style={{ textAlign: "center", paddingVertical: 16 }}>Ainda sem gastos este mês.</T>;
  return (
    <View style={{ gap: 14 }}>
      {rows.map((c) => {
        const up = c.averageBefore > 0 && c.amount > 1.3 * c.averageBefore;
        return (
          <View key={c.category} accessible accessibilityLabel={hide ? c.label : `${c.label}: ${short(c.amount)}${up ? ", acima da média" : ""}`}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <T variant="label" style={{ flexShrink: 1 }} numberOfLines={1}>{c.label}</T>
              <T variant="caption" color={colors.text}>{hide ? "••••" : short(c.amount)}{c.sharePercent > 0 && !hide ? `  ${c.sharePercent.toFixed(0)}%` : ""}</T>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: "#F1F5F9", marginTop: 5 }}>
              <View style={{ width: `${hide ? 0 : Math.max(c.amount > 0 ? 2 : 0, (c.amount / max) * 100)}%`, height: 10, borderRadius: 5, backgroundColor: SERIES }} />
              {c.averageBefore > 0 && !hide && <View style={{ position: "absolute", top: -3, left: `${(c.averageBefore / max) * 100}%`, width: 2, height: 16, borderRadius: 1, backgroundColor: "#64748B" }} />}
            </View>
            {up && !hide && <T variant="caption" style={{ marginTop: 3 }}>Acima da média ({short(c.averageBefore)})</T>}
          </View>
        );
      })}
    </View>
  );
}
