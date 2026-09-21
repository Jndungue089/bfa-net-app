import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ApiError, applyFieldErrors, beneficiarySchema, formatIban, isBfaIban } from "@bfa/shared";
import { errorMessage } from "@/components/features/errors";
import { Button, Card, FormText, Icon, IconButton, Notice, Screen, Sheet, Skeleton, T } from "@/components/ui";
import { useAddBeneficiary, useBeneficiaries, useRemoveBeneficiary } from "@/hooks/useBank";
import { colors } from "@/theme";

type In = z.input<typeof beneficiarySchema>;
type Out = z.output<typeof beneficiarySchema>;

export default function BeneficiariesScreen() {
  const router = useRouter();
  const list = useBeneficiaries();
  const add = useAddBeneficiary();
  const remove = useRemoveBeneficiary();
  const [open, setOpen] = useState(false);
  const { control, handleSubmit, reset, setError } = useForm<In, unknown, Out>({ resolver: zodResolver(beneficiarySchema), defaultValues: { name: "", iban: "" } });
  const hasFieldErrors = add.error instanceof ApiError && Object.keys(add.error.fieldErrors).length > 0;

  return (
    <Screen edges={[]} refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      <Button title="Novo beneficiário" onPress={() => { add.reset(); setOpen(true); }} />

      <Card style={{ paddingVertical: 4 }}>
        {list.isPending ? <Skeleton style={{ height: 80 }} /> : !list.data?.length ? (
          <View style={{ alignItems: "center", gap: 8, paddingVertical: 24 }}>
            <Icon name="people-outline" size={36} color={colors.muted} />
            <T variant="caption">Ainda não guardou nenhum beneficiário.</T>
          </View>
        ) : list.data.map((b, i) => (
          <View key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy50, alignItems: "center", justifyContent: "center" }}>
              <T style={{ fontWeight: "700", color: colors.navy800 }}>{b.name.slice(0, 1).toUpperCase()}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: "600" }} numberOfLines={1}>{b.name}</T>
              <T variant="caption" numberOfLines={1}>{isBfaIban(b.iban) ? "BFA · " : ""}{formatIban(b.iban)}</T>
            </View>
            <IconButton icon="paper-plane-outline" label={`Transferir para ${b.name}`} color={colors.brandDark} background={colors.brandFaint}
              onPress={() => router.push({ pathname: "/pay/transfers/iban", params: { to: b.iban } })} />
            <IconButton icon="trash-outline" label={`Remover ${b.name}`} color={colors.danger}
              onPress={() => Alert.alert("Remover beneficiário?", b.name, [{ text: "Cancelar", style: "cancel" }, { text: "Remover", style: "destructive", onPress: () => remove.mutate(b.id) }])} />
          </View>
        ))}
      </Card>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Novo beneficiário">
        {add.error && !hasFieldErrors ? <Notice kind="error">{errorMessage(add.error)}</Notice> : null}
        <FormText control={control} name="name" label="Nome" autoComplete="off" />
        <FormText control={control} name="iban" label="IBAN" autoCapitalize="characters" autoCorrect={false} placeholder="AO06 …" />
        <Button title="Guardar" loading={add.isPending}
          onPress={handleSubmit((v) => add.mutate(v, { onSuccess: () => { reset(); setOpen(false); }, onError: (e) => applyFieldErrors(e, setError, ["name", "iban"]) }))} />
      </Sheet>
    </Screen>
  );
}
