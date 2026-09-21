import { File } from "expo-file-system";
import { API_URL, USER_AGENT } from "./config";
import { refreshSession } from "./api";
import { assertSharingAvailable, openShareSheet, prepareShareTarget } from "./pdfShare";
import { useSessionStore } from "@/stores/session";

/** Smallest PDF the backend produces is several KB; a JSON error body is a few hundred bytes. */
const MIN_PDF_BYTES = 1500;

/**
 * Downloads a PDF **issued by the backend** (receipt or statement: logo, holder and account details) straight to a
 * file — streamed natively, no Blob — and opens the share sheet. One refresh + retry on an expired access token.
 * `path` is an API path such as `/api/v1/transactions/{id}/receipt.pdf`.
 */
export async function shareBackendPdf(path: string, baseName: string, dialogTitle: string): Promise<void> {
  await assertSharingAvailable();
  const target = prepareShareTarget(baseName);
  const url = `${API_URL}${path}`;

  const download = () => File.downloadFileAsync(url, target, {
    idempotent: true,
    headers: { Authorization: `Bearer ${useSessionStore.getState().accessToken ?? ""}`, Accept: "application/pdf", "X-BFA-Client": "mobile", "User-Agent": USER_AGENT },
  });

  let file: File;
  try { file = await download(); }
  catch (first) {
    if (!(await refreshSession())) throw first;
    file = await download();
  }
  if ((file.size ?? 0) < MIN_PDF_BYTES) throw new Error("O servidor não devolveu o documento.");
  await openShareSheet(file, dialogTitle);
}
