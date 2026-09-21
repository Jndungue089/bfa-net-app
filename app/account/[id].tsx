import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { formatIban, type Direction } from "@bfa/shared";
import { StatementRow } from "@/components/features/StatementRow";
import { accountTypeLabel } from "@/components/features/labels";
import { Card, Money, Notice, Skeleton, T } from "@/components/ui";
import { useAccount, useStatement } from "@/hooks/useBank";
import { colors } from "@/theme";

const FILTERS: Array<{ label: string; value: Direction | undefined }> = [{ label: "Todos", value: undefined }, { label: "Créditos", value: "Credit" }, { label: "Débitos", value: "Debit" }];

export default function AccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const account = useAccount(id);
  const [direction, setDirection] = useState<Direction | undefined>();
  const statement = useStatement(id, { direction });
  const items = statement.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <FlatList
      data={items} keyExtractor={(i) => String(i.entryId)} renderItem={({ item }) => <StatementRow item={item} />}
      contentContainerStyle={{ padding: 16, gap: 0 }} style={{ backgroundColor: colors.bg }}
      onEndReachedThreshold={0.4} onEndReached={() => statement.hasNextPage && !statement.isFetchingNextPage && statement.fetchNextPage()}
      refreshing={statement.isRefetching} onRefresh={() => { void statement.refetch(); void account.refetch(); }}
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 12 }}>
          {account.isError ? <Notice kind="error">Conta não encontrada.</Notice> : (
            <Card style={{ gap: 4 }}>
              {account.isPending ? <Skeleton style={{ height: 70 }} /> : (
                <>
                  <T variant="heading">{account.data.nickname ?? accountTypeLabel[account.data.type]}</T>
                  <T variant="caption" selectable>{formatIban(account.data.iban)}</T>
                  <View style={{ height: 8 }} />
                  <Money value={account.data.balance} currency={account.data.currency} variant="display" />
                </>
              )}
            </Card>
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FILTERS.map((f) => (
              <Pressable key={f.label} onPress={() => setDirection(f.value)} accessibilityRole="button" accessibilityState={{ selected: direction === f.value }}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: direction === f.value ? colors.navy800 : "#fff", borderWidth: 1, borderColor: colors.border }}>
                <T style={{ color: direction === f.value ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>{f.label}</T>
              </Pressable>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={statement.isPending ? <Skeleton style={{ height: 160 }} /> : statement.isError ? <Notice kind="error">Não foi possível carregar o extracto.</Notice> : <T variant="caption" style={{ textAlign: "center", padding: 24 }}>Sem movimentos.</T>}
      ListFooterComponent={statement.isFetchingNextPage ? <ActivityIndicator style={{ margin: 16 }} color={colors.brand} /> : null}
    />
  );
}
