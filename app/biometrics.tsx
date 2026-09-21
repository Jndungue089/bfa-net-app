import { useState } from "react";
import { Switch, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError, pinField } from "@bfa/shared";
import { BiometricGlyph } from "@/components/features/BiometricButton";
import { errorMessage } from "@/components/features/errors";
import { Button, Card, FormPin, FormText, Icon, Notice, Screen, Sheet, T, type IconName } from "@/components/ui";
import { useBiometricInfo, useDisableBiometric, useEnableBiometric, useEnrolledCustomer } from "@/hooks/useBiometricLogin";
import { useBiometricPrefs, useTogglePurchases, useToggleBiometrics } from "@/hooks/useBiometricSettings";
import { useSessionStore } from "@/stores/session";
import { colors } from "@/theme";

const passwordSchema = z.object({ password: z.string().min(1, "Indique a palavra-passe.").max(128) });
const pinSchema = z.object({ pin: pinField });
const isCancelled = (e: unknown) => e instanceof ApiError && e.code === "cancelled";

function SwitchRow({ icon, title, hint, value, disabled, busy, onChange }: { icon: IconName; title: string; hint: string; value: boolean; disabled?: boolean; busy?: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy50, alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={22} /></View>
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: "600" }}>{title}</T>
        <T variant="caption">{hint}</T>
      </View>
      <Switch value={value} disabled={disabled || busy} onValueChange={onChange} accessibilityLabel={title} trackColor={{ true: colors.brand, false: "#CBD5E1" }} />
    </View>
  );
}

export default function BiometricsScreen() {
  const info = useBiometricInfo();
  const prefs = useBiometricPrefs();
  const enrolled = useEnrolledCustomer();
  const me = useSessionStore((s) => s.profile?.customerNumber);
  const label = info?.label ?? "biometria";

  const master = useToggleBiometrics(label);
  const enableLogin = useEnableBiometric();
  const disableLogin = useDisableBiometric();
  const purchases = useTogglePurchases(label);

  const [askPassword, setAskPassword] = useState(false);
  const [askPin, setAskPin] = useState(false);
  const pw = useForm<{ password: string }>({ resolver: zodResolver(passwordSchema), defaultValues: { password: "" } });
  const pin = useForm<{ pin: string }>({ resolver: zodResolver(pinSchema), defaultValues: { pin: "" } });

  if (!info) return <Screen edges={[]}><T variant="caption">A verificar o dispositivo…</T></Screen>;
  if (!info.available) {
    return (
      <Screen edges={[]}>
        <Card style={{ alignItems: "center", gap: 10 }}>
          <Icon name="finger-print" size={44} color={colors.muted} />
          <T variant="heading">Biometria indisponível</T>
          <T variant="caption" style={{ textAlign: "center" }}>Este dispositivo não tem Face ID, Touch ID ou impressão digital configurados. Configure-os nas definições do sistema e volte aqui.</T>
        </Card>
      </Screen>
    );
  }

  const on = !!prefs.data?.enabled;
  const loginOn = on && enrolled.data === me && !!me;
  const purchasesOn = on && !!prefs.data?.purchases;
  const errors = [master.error, enableLogin.error, disableLogin.error, purchases.error].filter((e) => e && !isCancelled(e));

  return (
    <Screen edges={[]}>
      <Card style={{ alignItems: "center", gap: 8 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: on ? colors.successBg : colors.navy50, alignItems: "center", justifyContent: "center" }}>
          <BiometricGlyph kind={info.kind} size={38} color={on ? colors.success : colors.navy800} />
        </View>
        <T variant="heading">{label.charAt(0).toUpperCase() + label.slice(1)}</T>
        <T variant="caption" style={{ textAlign: "center" }}>{on ? "Activa neste dispositivo. Escolha onde a usar." : "Desactivada. Active para entrar e confirmar operações sem escrever códigos."}</T>
      </Card>

      {errors.length > 0 ? <Notice kind="error">{errorMessage(errors[0])}</Notice> : null}

      <Card style={{ paddingVertical: 2 }}>
        <SwitchRow icon="finger-print" title={`Usar ${label}`} hint="Interruptor geral neste dispositivo" value={on} busy={master.isPending}
          onChange={(v) => master.mutate(v)} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <SwitchRow icon="log-in-outline" title="Login com biometria" hint={loginOn ? "Entra sem palavra-passe" : "Pede a palavra-passe uma vez"} value={loginOn} disabled={!on} busy={disableLogin.isPending}
          onChange={(v) => { if (v) { enableLogin.reset(); pw.reset(); setAskPassword(true); } else disableLogin.mutate(label); }} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <SwitchRow icon="card-outline" title="Compras e pagamentos" hint={purchasesOn ? "Confirma com biometria em vez do PIN" : "Pede o PIN uma vez"} value={purchasesOn} disabled={!on} busy={purchases.isPending}
          onChange={(v) => { if (v) { purchases.reset(); pin.reset(); setAskPin(true); } else purchases.mutate({ on: false }); }} />
      </Card>

      {!on ? <Notice kind="info">Active «Usar {label}» para poder ligar o login e as compras.</Notice> : null}
      <T variant="caption" style={{ textAlign: "center" }}>
        As credenciais ficam guardadas no cofre seguro do telemóvel e só são libertadas depois de {label}. Se alterar a palavra-passe ou o PIN, tem de voltar a activar.
      </T>

      <Sheet visible={askPassword} onClose={() => setAskPassword(false)} title="Activar login com biometria" dismissible={!enableLogin.isPending}>
        <T variant="caption">Por segurança, confirme a sua palavra-passe.</T>
        {enableLogin.error && !isCancelled(enableLogin.error) ? <Notice kind="error">{errorMessage(enableLogin.error)}</Notice> : null}
        <FormText control={pw.control} name="password" label="Palavra-passe" secure autoCapitalize="none" autoCorrect={false} />
        <Button title="Confirmar e activar" loading={enableLogin.isPending}
          onPress={pw.handleSubmit((v) => enableLogin.mutate({ password: v.password, label }, { onSuccess: () => setAskPassword(false) }))} />
      </Sheet>

      <Sheet visible={askPin} onClose={() => setAskPin(false)} title="Pagamentos com biometria" dismissible={!purchases.isPending}>
        <T variant="caption">Introduza o seu PIN de operações. Fica protegido pelo cofre do telemóvel e é validado pelo banco a cada operação.</T>
        {purchases.error && !isCancelled(purchases.error) ? <Notice kind="error">{errorMessage(purchases.error)}</Notice> : null}
        <FormPin control={pin.control} name="pin" label="PIN de operações" />
        <Button title="Confirmar e activar" loading={purchases.isPending}
          onPress={pin.handleSubmit((v) => purchases.mutate({ on: true, pin: v.pin }, { onSuccess: () => { pin.reset(); setAskPin(false); } }))} />
      </Sheet>
    </Screen>
  );
}
