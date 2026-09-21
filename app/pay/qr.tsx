import { useState } from "react";
import type { QrPayload } from "@bfa/shared";
import { FlowScreen } from "@/components/features/FlowScreen";
import { QrPurchaseForm } from "@/components/features/QrPurchaseForm";
import { QrScanFlow } from "@/components/features/QrScanner";
import { Button, Card, T } from "@/components/ui";

type Pay = Extract<QrPayload, { kind: "pay" }>;

export default function QrPurchase() {
  const [payload, setPayload] = useState<Pay | null>(null);
  return (
    <FlowScreen>
      {(done) => payload ? (
        <>
          <Card><QrPurchaseForm payload={payload} onDone={done} /></Card>
          <Button title="Ler outro código" variant="ghost" onPress={() => setPayload(null)} />
        </>
      ) : (
        <>
          <T variant="caption">Aponte a câmara ao código QR do comerciante.</T>
          <QrScanFlow expect="pay" onPayload={(p) => p.kind === "pay" && setPayload(p)} />
        </>
      )}
    </FlowScreen>
  );
}
