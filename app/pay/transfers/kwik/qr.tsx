import { useState } from "react";
import type { QrPayload } from "@bfa/shared";
import { FlowScreen } from "@/components/features/FlowScreen";
import { KwikForm } from "@/components/features/KwikForm";
import { QrScanFlow } from "@/components/features/QrScanner";
import { Button, Card, T } from "@/components/ui";

type Kwik = Extract<QrPayload, { kind: "kwik" }>;

export default function KwikByQr() {
  const [payload, setPayload] = useState<Kwik | null>(null);
  return (
    <FlowScreen>
      {(done) => payload ? (
        <>
          <Card><KwikForm initial={{ key: payload.key, amount: payload.amount, name: payload.name }} onDone={done} /></Card>
          <Button title="Ler outro código" variant="ghost" onPress={() => setPayload(null)} />
        </>
      ) : (
        <>
          <T variant="caption">Aponte a câmara ao código QR KWiK do destinatário.</T>
          <QrScanFlow expect="kwik" onPayload={(p) => p.kind === "kwik" && setPayload(p)} />
        </>
      )}
    </FlowScreen>
  );
}
