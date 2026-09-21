import { Linking, Pressable, View } from "react-native";
import { useState } from "react";
import type { Contact } from "@bfa/shared";
import { Card, Icon, Notice, Screen, Skeleton, T, type IconName } from "@/components/ui";
import { useContacts } from "@/hooks/useBank";
import { colors } from "@/theme";

const ICONS: Record<Contact["kind"], IconName> = { phone: "call-outline", email: "mail-outline", web: "globe-outline", branch: "location-outline" };
// Data comes from the API, but only ever open the schemes a contact row can legitimately need.
const SAFE_URL = /^(tel:[+\d ]{3,20}|mailto:[^\s@]+@[^\s@]+|https:\/\/www\.bfa\.ao(\/[^\s]*)?)$/;

export default function ContactsScreen() {
  const contacts = useContacts();
  const [error, setError] = useState<string | null>(null);
  const open = async (c: Contact) => {
    if (!SAFE_URL.test(c.url)) return;
    try { await Linking.openURL(c.url); } catch { setError("Não foi possível abrir esta ligação neste dispositivo."); }
  };
  return (
    <Screen edges={[]}>
      {contacts.isPending ? <Skeleton style={{ height: 220 }} /> : contacts.isError ? <Notice kind="error">Não foi possível carregar os contactos.</Notice> : (
        <Card style={{ paddingVertical: 4 }}>
          {contacts.data.map((c, i) => (
            <Pressable key={c.url} onPress={() => open(c)} accessibilityRole="link" accessibilityLabel={`${c.label}: ${c.value}`}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, opacity: pressed ? 0.6 : 1 })}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brandFaint, alignItems: "center", justifyContent: "center" }}><Icon name={ICONS[c.kind]} size={22} color={colors.brandDark} /></View>
              <View style={{ flex: 1 }}><T variant="caption">{c.label}</T><T style={{ fontWeight: "600" }}>{c.value}</T></View>
              <Icon name="open-outline" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </Card>
      )}
      {error ? <Notice kind="error">{error}</Notice> : null}
      <T variant="caption" style={{ textAlign: "center" }}>Pode ainda dirigir-se a qualquer balcão BFA.</T>
    </Screen>
  );
}
