import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, pinConfirmSchema } from "@bfa/shared";
import { Button, FormPin, Notice, Sheet } from "@/components/ui";
import { usePurchaseBiometrics } from "@/hooks/useBiometricSettings";
import { errorMessage } from "./errors";

interface Props {
  visible: boolean;
  summary: React.ReactNode;
  pending: boolean;
  /** The raw error from the mutation (its message and code are derived here). */
  error?: unknown;
  onCancel: () => void;
  onConfirm: (pin: string) => void;
}

/**
 * Step-up authorisation for every money-moving operation: review, then enter the operations PIN — or, when the
 * customer enabled it, confirm with Face ID / Touch ID / fingerprint, which releases the PIN stored in the
 * Keychain/Keystore. The server still receives and verifies the PIN either way.
 */
export function PinSheet({ visible, summary, pending, error, onCancel, onConfirm }: Props) {
  const { control, handleSubmit, reset } = useForm<{ pin: string }>({ resolver: zodResolver(pinConfirmSchema), defaultValues: { pin: "" } });
  const bio = usePurchaseBiometrics();
  const usedBiometrics = useRef(false);
  const autoTried = useRef(false);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);

  // Never leave a PIN in component state after the sheet closes or an attempt is rejected.
  useEffect(() => { if (!visible) { reset({ pin: "" }); autoTried.current = false; setStale(false); } }, [visible, reset]);
  useEffect(() => { if (error) reset({ pin: "" }); }, [error, reset]);

  const confirmWithSensor = async () => {
    setBusy(true);
    try {
      const pin = await bio.unlock(); // null = cancelled: nothing to do, the PIN field is still there
      if (pin) { usedBiometrics.current = true; onConfirm(pin); }
    } finally { setBusy(false); }
  };

  // Offer the sensor as soon as the sheet opens.
  useEffect(() => {
    if (visible && bio.ready && !autoTried.current && !pending) { autoTried.current = true; void confirmWithSensor(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, bio.ready]);

  // The stored PIN was rejected (changed elsewhere): forget it so the user is not looped through a failing prompt.
  useEffect(() => {
    if (error instanceof ApiError && error.code === "invalid_pin" && usedBiometrics.current) { void bio.forget(); setStale(true); }
    if (error) usedBiometrics.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <Sheet visible={visible} onClose={onCancel} title="Confirmar operação" dismissible={!pending}>
      <View style={{ gap: 16, paddingBottom: 8 }}>
        <View style={{ backgroundColor: "#F8FAFC", borderRadius: 14, padding: 14 }}>{summary}</View>
        {bio.ready && bio.info ? (
          <Button title={`Confirmar com ${bio.info.label}`} variant="secondary" loading={busy} disabled={pending} onPress={confirmWithSensor} />
        ) : null}
        {stale ? <Notice kind="warning">O PIN guardado para biometria deixou de ser válido. Introduza o PIN e volte a activar a biometria em Segurança.</Notice> : null}
        <FormPin control={control} name="pin" label="PIN de operações" />
        {error ? <Notice kind="error">{errorMessage(error)}</Notice> : null}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button title="Cancelar" variant="secondary" onPress={onCancel} disabled={pending} style={{ flex: 1 }} />
          <Button title="Confirmar" loading={pending} onPress={handleSubmit((v) => onConfirm(v.pin))} style={{ flex: 1 }} />
        </View>
      </View>
    </Sheet>
  );
}

