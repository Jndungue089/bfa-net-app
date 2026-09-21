import { Alert, Switch, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { cardLimitSchema, formatMoney, type Card as CardData } from "@bfa/shared";
import { Button, FormMoney, Icon, Notice, Sheet, T, type IconName } from "@/components/ui";
import { useUpdateCard } from "@/hooks/useBank";
import { colors } from "@/theme";
import { errorMessage } from "./errors";

type In = z.input<typeof cardLimitSchema>;
type Out = z.output<typeof cardLimitSchema>;

function SettingRow({ icon, label, hint, value, disabled, onChange }: { icon: IconName; label: string; hint?: string; value: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.navy50, alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={20} /></View>
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: "600" }}>{label}</T>
        {hint ? <T variant="caption">{hint}</T> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: colors.brand, false: "#CBD5E1" }} accessibilityLabel={label} />
    </View>
  );
}

/**
 * Everything adjustable on a card, in one bottom sheet. Changes are optimistic (see useUpdateCard): only the touched
 * switch flips, nothing else is re-fetched or disabled, and a failed change rolls itself back.
 */
export function CardSettingsSheet({ card, visible, onClose }: { card: CardData; visible: boolean; onClose: () => void }) {
  const flags = useUpdateCard(); // switches + block, independent from the limit form
  const limit = useUpdateCard();
  const blocked = card.status === "Blocked";
  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<In, unknown, Out>({ resolver: zodResolver(cardLimitSchema), defaultValues: { dailyLimit: String(card.dailyLimit) } });
  const set = (patch: Partial<Record<"onlinePurchases" | "contactless" | "atmWithdrawals" | "internationalPayments", boolean>>) => flags.mutate({ id: card.id, ...patch });
  const failure = flags.error ?? limit.error;

  const confirmBlock = () =>
    Alert.alert("Bloquear cartão?", `O cartão terminado em ${card.last4} deixará de funcionar até ser desbloqueado.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Bloquear", style: "destructive", onPress: () => flags.mutate({ id: card.id, blocked: true }) },
    ]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Definições do cartão">
      {failure ? <Notice kind="error">{errorMessage(failure)} A alteração foi revertida.</Notice> : null}
      <T variant="caption">CANAIS DE UTILIZAÇÃO</T>
      <SettingRow icon="globe-outline" label="Compras online" value={card.onlinePurchases} disabled={blocked} onChange={(v) => set({ onlinePurchases: v })} />
      <SettingRow icon="wifi" label="Sem contacto" hint="Pagamentos por aproximação" value={card.contactless} disabled={blocked} onChange={(v) => set({ contactless: v })} />
      <SettingRow icon="cash-outline" label="Levantamentos ATM" value={card.atmWithdrawals} disabled={blocked} onChange={(v) => set({ atmWithdrawals: v })} />
      <SettingRow icon="airplane-outline" label="Pagamentos internacionais" hint="Fora de Angola" value={card.internationalPayments} disabled={blocked} onChange={(v) => set({ internationalPayments: v })} />

      <T variant="caption">LIMITE DIÁRIO · actual {formatMoney(card.dailyLimit)}</T>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
        <View style={{ flex: 1 }}><FormMoney control={control} name="dailyLimit" label="Novo limite" /></View>
        <Button title="Guardar" variant="secondary" disabled={!isDirty || blocked} loading={limit.isPending}
          onPress={handleSubmit((v) => limit.mutate({ id: card.id, dailyLimit: v.dailyLimit }, {
            onSuccess: (c) => reset({ dailyLimit: String(c.dailyLimit) }),
            onError: () => reset({ dailyLimit: String(card.dailyLimit) }),
          }))} />
      </View>

      <Button title={blocked ? "Desbloquear cartão" : "Bloquear cartão"} variant={blocked ? "primary" : "danger"}
        onPress={() => (blocked ? flags.mutate({ id: card.id, blocked: false }) : confirmBlock())} />
    </Sheet>
  );
}
