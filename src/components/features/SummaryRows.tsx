import { View } from "react-native";
import { T } from "@/components/ui";

export function SummaryRows({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <View style={{ gap: 8 }}>
      {rows.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => (
        <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
          <T variant="caption" style={{ fontSize: 14 }}>{k}</T>
          {typeof v === "string" ? <T style={{ fontWeight: "600", flexShrink: 1, textAlign: "right" }}>{v}</T> : v}
        </View>
      ))}
    </View>
  );
}
