import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { BrandLockup, Button, Notice, Screen, T } from "@/components/ui";
import { authenticate, resumeSession } from "@/hooks/useSessionLifecycle";
import { useLogout } from "@/hooks/useAuth";

export default function UnlockScreen() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const logout = useLogout();

  const unlock = useCallback(async () => {
    setError(null); setBusy(true);
    try {
      if (!(await authenticate())) return setError("Autenticação cancelada.");
      if (!(await resumeSession())) setError("Não foi possível retomar a sessão. Verifique a ligação ou entre novamente.");
    } finally { setBusy(false); }
  }, []);

  useEffect(() => { void unlock(); }, [unlock]);

  return (
    <Screen>
      <View style={{ alignItems: "center", marginTop: 48, gap: 8 }}>
        <BrandLockup height={52} />
        <T variant="title">Sessão bloqueada</T>
        <T variant="caption" style={{ textAlign: "center" }}>Confirme a sua identidade para continuar.</T>
      </View>
      {error ? <Notice kind="error">{error}</Notice> : null}
      <Button title="Desbloquear" loading={busy} onPress={unlock} />
      <Button title="Entrar com outra conta" variant="ghost" onPress={() => logout.mutate()} />
    </Screen>
  );
}
