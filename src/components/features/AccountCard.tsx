import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { formatIban, type Account } from "@bfa/shared";
import { Card, Money, T } from "@/components/ui";
import { accountTypeLabel } from "./labels";

export function AccountCard({ account }: { account: Account }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push({ pathname: "/account/[id]", params: { id: account.id } })} accessibilityRole="button" accessibilityLabel={`Conta ${account.nickname ?? accountTypeLabel[account.type]}`}>
      <Card style={{ gap: 4 }}>
        <T variant="heading">{account.nickname ?? accountTypeLabel[account.type]}</T>
        <T variant="caption">{formatIban(account.iban)}</T>
        <View style={{ height: 8 }} />
        <T variant="caption">SALDO DISPONÍVEL</T>
        <Money value={account.balance} currency={account.currency} style={{ fontSize: 22, fontWeight: "800", color: "#0B1450" }} />
      </Card>
    </Pressable>
  );
}
