import { useRouter } from "expo-router";
import { OptionRow } from "@/components/features/ServiceTile";
import { Card, Screen, T } from "@/components/ui";

export default function ServicesOptions() {
  const router = useRouter();
  return (
    <Screen edges={[]}>
      <T variant="caption">Escolha como pretende pagar.</T>
      <Card style={{ paddingVertical: 6 }}>
        <OptionRow icon="barcode-outline" title="Pagamento por referência" subtitle="Entidade e referência" onPress={() => router.push("/pay/reference")} />
      </Card>
    </Screen>
  );
}
