import { View } from "react-native";
import { formatDate, formatRate } from "@bfa/shared";
import { useExchangeRates } from "@/hooks/useBank";
import { Card, Skeleton, T } from "@/components/ui";

export function FxCard() {
  const { data, isPending, isError } = useExchangeRates();
  return (
    <Card style={{ gap: 10 }}>
      <T variant="heading">Câmbios</T>
      {isPending ? <Skeleton style={{ height: 48 }} /> : isError || !data?.length ? <T variant="caption">Indisponível de momento.</T> : (
        <>
          <View style={{ flexDirection: "row" }}><T variant="caption" style={{ flex: 1 }}>Moeda</T><T variant="caption" style={{ width: 80, textAlign: "right" }}>Compra</T><T variant="caption" style={{ width: 80, textAlign: "right" }}>Venda</T></View>
          {data.map((r) => (
            <View key={r.currency} style={{ flexDirection: "row" }}>
              <T style={{ flex: 1, fontWeight: "700" }}>{r.currency}</T>
              <T style={{ width: 80, textAlign: "right" }}>{formatRate(r.buy)}</T><T style={{ width: 80, textAlign: "right" }}>{formatRate(r.sell)}</T>
            </View>
          ))}
          <T variant="caption">Valores indicativos em Kz · {data[0] && formatDate(data[0].updatedAt)}</T>
        </>
      )}
    </Card>
  );
}
