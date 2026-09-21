import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";

// Statements and receipts are financial data: they only ever live in the app's private cache, in one folder
// that is emptied before every export, at logout and at app start.
const dir = () => new Directory(Paths.cache, "bfanet-share");

export function purgeShareFiles(): void {
  try { const d = dir(); if (d.exists) d.delete(); } catch { /* nothing to clean, or not deletable right now */ }
}

const safe = (name: string) => name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);

/** Empties the share folder and returns the file the next PDF must be written to. */
export function prepareShareTarget(baseName: string): File {
  purgeShareFiles();
  const folder = dir();
  folder.create({ intermediates: true, idempotent: true });
  return new File(folder, `${safe(baseName)}.pdf`);
}

/**
 * Opens the system share sheet for a PDF that already exists in the share folder.
 *
 * The file is deliberately NOT deleted afterwards: on Android `shareAsync` resolves as soon as the chooser opens,
 * and the receiving app reads the file later — deleting it here made the shared PDF fail. It is purged on the
 * next export / logout / launch instead.
 */
export async function openShareSheet(file: File, dialogTitle: string): Promise<void> {
  await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle });
}

export async function assertSharingAvailable(): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error("A partilha não está disponível neste dispositivo.");
}
