import { useState } from "react";
import { useRouter } from "expo-router";
import type { Receipt } from "@bfa/shared";
import { Screen } from "@/components/ui";
import { ReceiptView } from "./ReceiptView";

/** Wraps a money-moving form: shows the receipt on success and returns to the services grid when done. */
export function FlowScreen({ children }: { children: (done: (r: Receipt) => void) => React.ReactNode }) {
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  return (
    <Screen edges={[]}>
      {receipt ? <ReceiptView receipt={receipt} onDone={() => router.dismissAll()} /> : children(setReceipt)}
    </Screen>
  );
}
