import { View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { PROVIDER_ORDER, RECHARGE_PROVIDERS, type RechargeProvider } from "@bfa/shared";
import { FlowScreen } from "@/components/features/FlowScreen";
import { RechargeForm } from "@/components/features/PaymentForms";
import { ProviderLogo } from "@/components/features/ProviderTile";
import { Card, T } from "@/components/ui";

export default function RechargeScreen() {
  const { provider } = useLocalSearchParams<{ provider: string }>();
  // The route param is user-controllable (deep links): only accept known providers.
  if (!PROVIDER_ORDER.includes(provider as RechargeProvider)) return <Redirect href="/pay/recharges" />;
  const p = provider as RechargeProvider;
  return (
    <FlowScreen>
      {(done) => (
        <Card style={{ gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <ProviderLogo provider={p} />
            <T variant="heading">{RECHARGE_PROVIDERS[p].label}</T>
          </View>
          <RechargeForm provider={p} onDone={done} />
        </Card>
      )}
    </FlowScreen>
  );
}
