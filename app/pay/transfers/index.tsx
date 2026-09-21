import { useRouter } from "expo-router";
import { OptionRow } from "@/components/features/ServiceTile";
import { Card, Screen } from "@/components/ui";

export default function TransferOptions() {
  const router = useRouter();
  return (
    <Screen edges={[]}>
      <Card style={{ paddingVertical: 6 }}>
        <OptionRow icon="card-outline" title="Por IBAN" subtitle="Para qualquer conta bancária" onPress={() => router.push("/pay/transfers/iban")} />
        <OptionRow icon="flash-outline" title="KWiK" subtitle="Instantânea, por nº de telemóvel" onPress={() => router.push("/pay/transfers/kwik")} />
      </Card>
    </Screen>
  );
}
