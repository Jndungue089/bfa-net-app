import { File, UploadType } from "expo-file-system";
import { ApiError } from "@bfa/shared";
import { API_URL, USER_AGENT } from "./config";
import { refreshSession } from "./api";
import { useSessionStore } from "@/stores/session";

/**
 * Uploads the picked photo to the backend with the native multipart uploader (streams from disk, no JS Blob or
 * FormData involved). The backend validates the real type, crops to a square, resizes and re-encodes it.
 * One refresh + retry when the access token has expired.
 */
export async function uploadAvatar(uri: string, mimeType: string): Promise<void> {
  const url = `${API_URL}/api/v1/me/avatar`;
  const attempt = () => new File(uri).upload(url, {
    httpMethod: "PUT", uploadType: UploadType.MULTIPART, fieldName: "file", mimeType,
    headers: { Authorization: `Bearer ${useSessionStore.getState().accessToken ?? ""}`, Accept: "application/json", "X-BFA-Client": "mobile", "User-Agent": USER_AGENT },
  });

  let res = await attempt();
  if (res.status === 401 && (await refreshSession())) res = await attempt();
  if (res.status >= 200 && res.status < 300) return;

  // Surface the server's own message (RFC 7807) when there is one.
  let title = "Não foi possível enviar a fotografia.";
  let code = "upload_failed";
  try {
    const p = JSON.parse(res.body) as { title?: string; code?: string; errors?: Record<string, string[]> };
    title = p.errors?.file?.[0] ?? p.title ?? title;
    code = p.code ?? code;
  } catch { /* non-JSON body */ }
  throw new ApiError(res.status, code, title);
}
