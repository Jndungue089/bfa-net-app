import { useState } from "react";
import { View } from "react-native";
import type { Card } from "@bfa/shared";
import { BankCard } from "@/components/features/BankCard";
import { CardSettingsSheet } from "@/components/features/CardSettingsSheet";
import { Button, Icon, Notice, Screen, Skeleton, T } from "@/components/ui";
import { useCards } from "@/hooks/useBank";
import { colors } from "@/theme";

function CardBlock({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);
  const blocked = card.status === "Blocked";
  return (
    <View style={{ gap: 14 }}>
      <BankCard card={card} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name={blocked ? "lock-closed" : "shield-checkmark-outline"} size={18} color={blocked ? colors.danger : colors.success} />
        <T variant="caption" style={{ flex: 1 }}>{blocked ? "Cartão bloqueado" : "Cartão activo"} · {card.productName}</T>
      </View>
      <Button title="Definições do cartão" variant="secondary" onPress={() => setOpen(true)} />
      <CardSettingsSheet card={card} visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

export default function CardsScreen() {
  const cards = useCards();
  return (
    <Screen refreshing={cards.isRefetching} onRefresh={() => cards.refetch()}>
      <T variant="title">Cartões</T>
      {cards.isError ? <Notice kind="error">Não foi possível carregar os cartões.</Notice> : null}
      {cards.isPending ? <Skeleton style={{ height: 210, borderRadius: 22 }} /> : cards.data?.map((c) => <CardBlock key={c.id} card={c} />)}
      {cards.data?.length === 0 ? <T variant="caption">Não tem cartões associados.</T> : null}
    </Screen>
  );
}
