import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { parseQr, type QrPayload } from "@bfa/shared";
import { Button, Icon, Notice, T } from "@/components/ui";
import { colors, fonts, radius } from "@/theme";

/** Camera QR scanner + "paste the code" fallback. Emits only payloads that passed strict parsing. */
export function QrScanFlow({ expect, onPayload }: { expect: QrPayload["kind"]; onPayload: (p: QrPayload) => void }) {
  const [permission, request] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [text, setText] = useState("");
  const [scanKey, setScanKey] = useState(0);
  const locked = useRef(false);

  const handle = (raw: string) => {
    const r = parseQr(raw);
    if (!r.ok) { setError(r.reason); return false; }
    if (r.payload.kind !== expect) { setError(expect === "pay" ? "Este é um QR KWiK, não um QR de compra." : "Este é um QR de compra, não um QR KWiK."); return false; }
    setError(null); onPayload(r.payload); return true;
  };
  const rescan = () => { locked.current = false; setError(null); setScanKey((k) => k + 1); };

  return (
    <View style={{ gap: 16 }}>
      {permission?.granted ? (
        <View style={{ height: 340, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000" }}>
          <CameraView
            key={scanKey} style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => { if (locked.current) return; locked.current = true; if (!handle(data)) setTimeout(() => { locked.current = false; }, 1500); }}
          />
          <View pointerEvents="none" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 210, height: 210, borderRadius: 24, borderWidth: 3, borderColor: "rgba(255,255,255,0.9)" }} />
          </View>
        </View>
      ) : (
        <View style={{ padding: 20, borderRadius: radius.lg, backgroundColor: colors.navy50, alignItems: "center", gap: 10 }}>
          <Icon name="camera-outline" size={40} color={colors.navy800} />
          <T style={{ textAlign: "center" }}>Permita o acesso à câmara para ler o código QR.</T>
          <Button title="Permitir câmara" onPress={request} />
        </View>
      )}
      {error ? <Notice kind="error">{error}</Notice> : null}
      <Button title={manual ? "Fechar entrada manual" : "Inserir código manualmente"} variant="ghost" onPress={() => setManual((m) => !m)} />
      {manual ? <ManualCode value={text} onChange={setText} onSubmit={() => handle(text.trim())} /> : null}
      {error ? <Button title="Ler novamente" variant="secondary" onPress={rescan} /> : null}
    </View>
  );
}


function ManualCode({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <View style={{ gap: 12 }}>
      <TextInput
        value={value} onChangeText={onChange} multiline autoCapitalize="none" autoCorrect={false} placeholder="BFAPAY:v1;iban=…" placeholderTextColor={colors.placeholder} accessibilityLabel="Código QR"
        style={{ minHeight: 88, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, backgroundColor: "#fff", fontFamily: fonts.regular, fontSize: 15, textAlignVertical: "top" }}
      />
      <Button title="Validar código" onPress={onSubmit} disabled={value.trim().length === 0} />
    </View>
  );
}
