import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { greeting } from "@bfa/shared";
import { AccountCard } from "@/components/features/AccountCard";
import { Avatar } from "@/components/features/Avatar";
import { FxCard } from "@/components/features/FxCard";
import { StatementRow } from "@/components/features/StatementRow";
import { Card, Icon, IconButton, Money, Notice, Screen, Skeleton, T, type IconName } from "@/components/ui";
import { useAccounts, useStatement } from "@/hooks/useBank";
import { usePrivacyStore } from "@/stores/privacy";
import { useSessionStore } from "@/stores/session";
import { colors } from "@/theme";

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ alignItems: "center", gap: 8, flex: 1, opacity: pressed ? 0.6 : 1 })}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={26} color="#fff" /></View>
      <T style={{ color: "#fff", fontSize: 13.5, fontWeight: "600" }} numberOfLines={1}>{label}</T>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useSessionStore((s) => s.profile);
  const { hide, toggle } = usePrivacyStore();
  const accounts = useAccounts();
  const main = accounts.data?.find((a) => a.type === "Ordem") ?? accounts.data?.[0];
  const recent = useStatement(main?.id ?? "", {}, 5);
  const total = accounts.data?.filter((a) => a.currency === "AOA").reduce((s, a) => s + a.balance, 0) ?? 0;

  return (
    <Screen refreshing={accounts.isRefetching} onRefresh={() => qc.invalidateQueries()}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={profile?.fullName ?? ""} version={profile?.avatarVersion} size={48} />
        <View style={{ flex: 1 }}>
          <T variant="caption">{greeting()},</T>
          <T variant="heading" numberOfLines={1}>{profile?.fullName.split(" ")[0] ?? "…"}</T>
        </View>
        <IconButton icon={hide ? "eye-off-outline" : "eye-outline"} label={hide ? "Mostrar saldos" : "Ocultar saldos"} onPress={toggle} />
      </View>

      <Card style={{ backgroundColor: colors.navy900, borderColor: colors.navy900, gap: 18, paddingVertical: 20 }}>
        <View style={{ gap: 4 }}>
          <T variant="caption" color="rgba(255,255,255,0.7)" style={{ fontSize: 14.5 }}>Saldo total</T>
          {accounts.isPending ? <Skeleton style={{ height: 38, width: 220, backgroundColor: "rgba(255,255,255,0.2)" }} /> : <Money value={total} style={{ fontSize: 34, fontWeight: "800", color: "#fff" }} />}
        </View>
        <View style={{ flexDirection: "row" }}>
          <QuickAction icon="swap-horizontal-outline" label="Transferir" onPress={() => router.push("/pay/transfers")} />
          <QuickAction icon="qr-code-outline" label="QR Code" onPress={() => router.push("/pay/qr")} />
          <QuickAction icon="phone-portrait-outline" label="Carregar" onPress={() => router.push("/pay/recharges")} />
          <QuickAction icon="document-text-outline" label="Extracto" onPress={() => router.push("/statement")} />
        </View>
      </Card>

      {accounts.isError ? <Notice kind="error">Não foi possível carregar as suas contas.</Notice> : null}
      {accounts.isPending ? <Skeleton style={{ height: 120 }} /> : accounts.data?.map((a) => <AccountCard key={a.id} account={a} />)}

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <T variant="heading">Últimos movimentos</T>
          {main ? <IconButton icon="chevron-forward" label="Ver extracto" onPress={() => router.push("/statement")} color={colors.brandDark} /> : null}
        </View>
        {(recent.data?.pages[0]?.items ?? []).map((i, n) => <View key={i.entryId} style={n ? { borderTopWidth: 1, borderTopColor: colors.border } : undefined}><StatementRow item={i} /></View>)}
        {recent.data?.pages[0]?.items.length === 0 ? <T variant="caption" style={{ paddingVertical: 12 }}>Sem movimentos.</T> : null}
      </Card>
      <FxCard />
    </Screen>
  );
}
