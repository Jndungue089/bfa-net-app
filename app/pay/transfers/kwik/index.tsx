import { useRouter } from "expo-router";
import { OptionRow } from "@/components/features/ServiceTile";
import { Card, Screen } from "@/components/ui";

export default function KwikOptions() {
  const router = useRouter();
  return (
    <Screen edges={[]}>
      <Card style={{ paddingVertical: 6 }}>
        <OptionRow icon="keypad-outline" title="Por chave KWiK" subtitle="Nº de telemóvel do destinatário" onPress={() => router.push("/pay/transfers/kwik/key")} />
        <OptionRow icon="qr-code-outline" title="Por QR Code" subtitle="Ler o código KWiK" onPress={() => router.push("/pay/transfers/kwik/qr")} />
      </Card>
    </Screen>
  );
}
