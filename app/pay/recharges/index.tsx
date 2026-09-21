import { View } from "react-native";
import { useRouter } from "expo-router";
import { PROVIDER_ORDER } from "@bfa/shared";
import { ProviderTile } from "@/components/features/ProviderTile";
import { Screen, T } from "@/components/ui";

export default function RechargeProviders() {
  const router = useRouter();
  return (
    <Screen edges={[]}>
      <T variant="caption">Escolha o fornecedor.</T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
        {PROVIDER_ORDER.map((p) => <ProviderTile key={p} provider={p} onPress={() => router.push({ pathname: "/pay/recharges/[provider]", params: { provider: p } })} />)}
      </View>
    </Screen>
  );
}
