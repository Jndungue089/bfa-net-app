import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, loginSchema, type LoginForm } from "@bfa/shared";
import { BiometricButton } from "@/components/features/BiometricButton";
import { BrandLockup, Button, FormText, Notice, Screen, T } from "@/components/ui";
import { useLogin } from "@/hooks/useAuth";
import { useBiometricInfo, useBiometricLogin, useEnrolledCustomer } from "@/hooks/useBiometricLogin";

const message = (e: unknown) => {
  if (!e) return null;
  if (e instanceof ApiError) return e.code === "cancelled" ? null : e.status === 429 ? "Demasiadas tentativas. Aguarde um minuto." : e.message;
  return "Ocorreu um erro inesperado.";
};

export default function LoginScreen() {
  const login = useLogin();
  const bio = useBiometricLogin();
  const info = useBiometricInfo();
  const enrolled = useEnrolledCustomer();
  const { control, handleSubmit } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { customerNumber: "", password: "" } });

  const canBiometric = !!info?.available && !!enrolled.data;
  const tried = useRef(false);
  // Offer the sensor immediately, once, when this device is enrolled.
  useEffect(() => {
    if (canBiometric && info && !tried.current) { tried.current = true; bio.mutate(info.label); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBiometric]);

  const error = message(login.error) ?? message(bio.error);

  return (
    <Screen>
      <View style={{ alignItems: "center", marginTop: 40, marginBottom: 8, gap: 10 }}>
        <BrandLockup height={56} />
        <T variant="caption">Entre com o seu número de adesão</T>
      </View>
      {error ? <Notice kind="error">{error}</Notice> : null}

      {canBiometric && info ? (
        <>
          <BiometricButton info={info} loading={bio.isPending} onPress={() => bio.mutate(info.label)} />
          <T variant="caption" style={{ textAlign: "center" }}>Adesão {enrolled.data} · ou use a palavra-passe</T>
        </>
      ) : null}

      <FormText control={control} name="customerNumber" label="Número de adesão" keyboardType="number-pad" autoComplete="username" textContentType="username"
        sanitize={(v) => v.replace(/\D/g, "").slice(0, 8)} placeholder="8 dígitos" />
      <FormText control={control} name="password" label="Palavra-passe" secure autoComplete="current-password" textContentType="password" autoCapitalize="none" autoCorrect={false} />
      <Button title="Entrar" loading={login.isPending} onPress={handleSubmit((v) => login.mutate(v))} />
      <T variant="caption" style={{ textAlign: "center" }}>Ainda não tem adesão? Crie-a no BFA NET web ou num balcão BFA.</T>
    </Screen>
  );
}
