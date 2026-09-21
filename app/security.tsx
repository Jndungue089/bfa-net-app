import { Alert, View } from "react-native";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ApiError, applyFieldErrors, changePasswordSchema, changePinSchema, formatDateTime, passwordStrength } from "@bfa/shared";
import { errorMessage } from "@/components/features/errors";
import { Button, Card, FormPin, FormText, Icon, Notice, Screen, T } from "@/components/ui";
import { useChangePassword, useChangePin, useSessions } from "@/hooks/useAuth";
import { useBiometricInfo } from "@/hooks/useBiometricLogin";
import { BiometricGlyph } from "@/components/features/BiometricButton";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { bankApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "@/theme";

type PwIn = z.input<typeof changePasswordSchema>;
type PinIn = z.input<typeof changePinSchema>;
const STRENGTH = ["", "Fraca", "Razoável", "Boa", "Forte"];

function PasswordCard() {
  const change = useChangePassword();
  const { control, handleSubmit, reset, setError } = useForm<PwIn>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const pw = useWatch({ control, name: "newPassword" }) ?? "";
  const hasField = change.error instanceof ApiError && Object.keys(change.error.fieldErrors).length > 0;
  return (
    <Card style={{ gap: 12 }}>
      <T variant="heading">Alterar palavra-passe</T>
      {change.isSuccess ? <Notice kind="success">Palavra-passe alterada. As outras sessões foram terminadas.</Notice> : null}
      {change.error && !hasField ? <Notice kind="error">{errorMessage(change.error)}</Notice> : null}
      <FormText control={control} name="currentPassword" label="Palavra-passe actual" secure autoCapitalize="none" autoCorrect={false} />
      <FormText control={control} name="newPassword" label="Nova palavra-passe" secure autoCapitalize="none" autoCorrect={false} hint={pw ? `Força: ${STRENGTH[passwordStrength(pw)]}` : undefined} />
      <FormText control={control} name="confirmPassword" label="Confirmar" secure autoCapitalize="none" autoCorrect={false} />
      <Button title="Alterar palavra-passe" loading={change.isPending}
        onPress={handleSubmit((v) => change.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword }, { onSuccess: () => reset(), onError: (e) => applyFieldErrors(e, setError, ["currentPassword", "newPassword"]) }))} />
    </Card>
  );
}

function PinCard() {
  const change = useChangePin();
  const { control, handleSubmit, reset } = useForm<PinIn>({ resolver: zodResolver(changePinSchema), defaultValues: { currentPin: "", newPin: "", confirmPin: "" } });
  return (
    <Card style={{ gap: 12 }}>
      <T variant="heading">Alterar PIN de operações</T>
      {change.isSuccess ? <Notice kind="success">PIN alterado com sucesso.</Notice> : null}
      {change.error ? <Notice kind="error">{errorMessage(change.error)}</Notice> : null}
      <FormPin control={control} name="currentPin" label="PIN actual" />
      <FormPin control={control} name="newPin" label="Novo PIN" />
      <FormPin control={control} name="confirmPin" label="Confirmar novo PIN" />
      <Button title="Alterar PIN" loading={change.isPending} onPress={handleSubmit((v) => change.mutate({ currentPin: v.currentPin, newPin: v.newPin }, { onSuccess: () => reset() }))} />
    </Card>
  );
}

function SessionsCard() {
  const { data } = useSessions();
  const qc = useQueryClient();
  const revoke = (id: string) => bankApi.auth.revokeSession(id).then(() => qc.invalidateQueries({ queryKey: ["sessions"] }));
  return (
    <Card style={{ gap: 4 }}>
      <T variant="heading" style={{ marginBottom: 8 }}>Sessões activas</T>
      {data?.map((s) => (
        <View key={s.familyId} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <T style={{ fontWeight: "600" }}>{s.device ?? "Dispositivo desconhecido"}{s.current ? " · esta sessão" : ""}</T>
            <T variant="caption">{s.ipAddress ?? "IP desconhecido"} · desde {formatDateTime(s.createdAt)}</T>
          </View>
          {!s.current && <Button title="Terminar" variant="secondary" style={{ minHeight: 36 }} onPress={() => Alert.alert("Terminar sessão?", s.device ?? undefined, [{ text: "Cancelar", style: "cancel" }, { text: "Terminar", style: "destructive", onPress: () => void revoke(s.familyId) }])} />}
        </View>
      ))}
    </Card>
  );
}

function BiometricsLink() {
  const router = useRouter();
  const info = useBiometricInfo();
  return (
    <Pressable onPress={() => router.push("/biometrics")} accessibilityRole="button" accessibilityLabel="Biometria"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brandFaint, alignItems: "center", justifyContent: "center" }}>
          <BiometricGlyph kind={info?.kind ?? "fingerprint"} size={24} color={colors.brandDark} />
        </View>
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: "600" }}>Biometria</T>
          <T variant="caption">Login e confirmação de pagamentos</T>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

export default function SecurityScreen() {
  return (
    <Screen edges={[]}>
      <BiometricsLink />
      <PasswordCard />
      <PinCard />
      <SessionsCard />
    </Screen>
  );
}
