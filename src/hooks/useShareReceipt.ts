import { useState } from "react";
import { receiptPdfPath, type Receipt } from "@bfa/shared";
import { shareBackendPdf } from "@/lib/receiptShare";

/** Shares the backend-issued PDF receipt, tracking progress and a user-facing error. */
export function useShareReceipt() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const share = async (r: Pick<Receipt, "transactionId" | "reference">) => {
    setPending(true); setError(null);
    try { await shareBackendPdf(receiptPdfPath(r.transactionId), `comprovativo-${r.reference}`, "Comprovativo BFA NET"); }
    catch (e) {
      if (__DEV__) console.warn("Partilha do comprovativo falhou:", e);
      const msg = e instanceof Error ? e.message : "";
      setError(
        /status: 404/.test(msg) ? "Comprovativo não encontrado. Se o servidor foi actualizado há pouco, reinicie o backend."
        : /status: 401|status: 403/.test(msg) ? "A sessão expirou. Volte a iniciar sessão."
        : `Não foi possível obter o comprovativo${msg ? `: ${msg}` : "."}`,
      );
    } finally { setPending(false); }
  };
  return { share, pending, error };
}
