import { Alert, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError, formatDate, formatDateTime, formatPhone } from "@bfa/shared";
import { Avatar } from "@/components/features/Avatar";
import { errorMessage } from "@/components/features/errors";
import { SummaryRows } from "@/components/features/SummaryRows";
import { Button, Card, Icon, IconButton, Notice, Screen, T, type IconName } from "@/components/ui";
import { useLogout } from "@/hooks/useAuth";
import { useRemoveAvatar, useUploadAvatar } from "@/hooks/useAvatar";
import { useSessionStore } from "@/stores/session";
import { colors } from "@/theme";

function MenuRow({ icon, title, onPress, first }: { icon: IconName; title: string; onPress: () => void; first?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border, opacity: pressed ? 0.6 : 1 })}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy50, alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={20} /></View>
      <T style={{ flex: 1, fontWeight: "600" }}>{title}</T>
      <Icon name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const p = useSessionStore((s) => s.profile);
  const logout = useLogout();
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  if (!p) return null;
  const busy = upload.isPending || remove.isPending;
  const photoError = (upload.error ?? remove.error) ? errorMessage(upload.error ?? remove.error) : null;

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 6, paddingTop: 8 }}>
        <View>
          <Avatar name={p.fullName} version={p.avatarVersion} size={112} />
          <View style={{ position: "absolute", right: -4, bottom: -4, backgroundColor: colors.brand, borderRadius: 22, borderWidth: 3, borderColor: colors.bg }}>
            <IconButton icon="camera" label="Alterar fotografia" color="#fff" size={20} disabled={busy} onPress={() => upload.mutate()} />
          </View>
        </View>
        <T variant="title" style={{ textAlign: "center" }}>{p.fullName}</T>
        <T variant="caption">Adesão {p.customerNumber}</T>
        {p.avatarVersion != null ? <IconButton icon="trash-outline" label="Remover fotografia" color={colors.danger} disabled={busy} onPress={() => remove.mutate()} /> : null}
      </View>
      {photoError && !(upload.error instanceof ApiError && upload.error.code === "cancelled") ? <Notice kind="error">{photoError}</Notice> : null}

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon name="lock-closed-outline" size={18} color={colors.muted} />
          <T variant="heading" style={{ flex: 1 }}>Os meus dados</T>
        </View>
        <SummaryRows rows={[["Email", p.email], ["Telemóvel", formatPhone(p.phone)], ["BI", p.nationalId], ["Nascimento", formatDate(`${p.birthDate}T00:00:00Z`)], ["Último acesso", p.lastLoginAt ? formatDateTime(p.lastLoginAt) : "—"]]} />
        <Notice kind="info">Estes dados são geridos pelo banco. Para os alterar, dirija-se a um balcão BFA.</Notice>
      </Card>

      <Card style={{ paddingVertical: 2 }}>
        <MenuRow first icon="shield-checkmark-outline" title="Segurança e sessões" onPress={() => router.push("/security")} />
      </Card>

      <Card style={{ paddingVertical: 2 }}>
        <MenuRow first icon="document-text-outline" title="Extracto bancário" onPress={() => router.push("/statement")} />
        <MenuRow icon="people-outline" title="Beneficiários" onPress={() => router.push("/beneficiaries")} />
        <MenuRow icon="information-circle-outline" title="Sobre o BFA" onPress={() => router.push("/about")} />
        <MenuRow icon="call-outline" title="Contactos" onPress={() => router.push("/contacts")} />
      </Card>

      <Button title="Terminar sessão" variant="danger" loading={logout.isPending}
        onPress={() => Alert.alert("Terminar sessão?", undefined, [{ text: "Cancelar", style: "cancel" }, { text: "Terminar", style: "destructive", onPress: () => logout.mutate() }])} />
    </Screen>
  );
}
