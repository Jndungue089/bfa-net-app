import { View } from "react-native";
import { useRouter } from "expo-router";
import { BalancePanel } from "@/components/features/BalancePanel";
import { BankCard } from "@/components/features/BankCard";
import { ServiceTile } from "@/components/features/ServiceTile";
import { Screen, Skeleton, T } from "@/components/ui";
import { useAccounts, useCards } from "@/hooks/useBank";

export default function ServicesScreen() {
  const router = useRouter();
  const cards = useCards();
  const accounts = useAccounts();
  const card = cards.data?.[0];
  const account = accounts.data?.find((a) => a.id === card?.accountId) ?? accounts.data?.[0];

  return (
    <Screen>
      <T variant="title">Serviços</T>

      {cards.isPending ? <Skeleton style={{ height: 200, borderRadius: 22 }} /> : card ? <BankCard card={card} /> : null}
      {accounts.isPending ? <Skeleton style={{ height: 150, borderRadius: 24 }} /> : account ? <BalancePanel account={account} /> : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12, marginTop: 4 }}>
        <ServiceTile icon="receipt-outline" label="Pagamento de serviços" onPress={() => router.push("/pay/services")} />
        <ServiceTile icon="business-outline" label="Pagamentos ao Estado" onPress={() => router.push("/pay/state")} />
        <ServiceTile icon="phone-portrait-outline" label="Carregamentos" onPress={() => router.push("/pay/recharges")} />
        <ServiceTile icon="qr-code-outline" label="Compra com QR Code" onPress={() => router.push("/pay/qr")} />
        <ServiceTile icon="swap-horizontal-outline" label="Transferências" onPress={() => router.push("/pay/transfers")} />
      </View>
    </Screen>
  );
}
