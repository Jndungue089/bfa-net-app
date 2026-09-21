import { View } from "react-native";
import type { Health } from "@bfa/shared";
import { T } from "@/components/ui";
import { colors } from "@/theme";

export const SERIES = "#3B52C4"; // validated series blue; text stays in ink colours

function Meter({ value, max }: { value: number; max: number }) {
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }} style={{ height: 8, borderRadius: 4, backgroundColor: "#E2E8F0", marginTop: 4 }}>
      <View style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: SERIES }} />
    </View>
  );
}

/** Overall score as a big number over a meter, then the four weighted factors. */
export function HealthMeter({ health }: { health: Health }) {
  return (
    <View style={{ gap: 14 }}>
      <View accessible accessibilityLabel={`Saúde financeira: ${health.score} em 100, ${health.label}`}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <T variant="display">{health.score}</T><T variant="caption">/ 100</T>
          <T variant="heading" style={{ marginLeft: "auto" }}>{health.label}</T>
        </View>
        <Meter value={health.score} max={100} />
      </View>
      {health.factors.map((f) => (
        <View key={f.name}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <T variant="label" style={{ flexShrink: 1 }}>{f.name}</T><T variant="caption">{f.score}/{f.max}</T>
          </View>
          <Meter value={f.score} max={f.max} />
          <T variant="caption" style={{ marginTop: 3, color: colors.muted }}>{f.note}</T>
        </View>
      ))}
    </View>
  );
}
