import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@bfa/shared";
import { bankApi } from "@/lib/api";
import { uploadAvatar } from "@/lib/avatarUpload";
import { useSessionStore } from "@/stores/session";

const MAX_BYTES = 10 * 1024 * 1024; // must match IAvatarService.MaxUploadBytes

/**
 * Pick from the gallery (no OS crop step — the server crops to a square), then hand the file to the backend.
 * `Compatible` makes iOS convert HEIC to JPEG; `quality` keeps modern 12–50 MP photos well under the 10 MB limit.
 */
export function useUploadAvatar() {
  return useMutation({
    mutationFn: async () => {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsMultipleSelection: false, quality: 0.8, exif: false,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      const asset = picked.canceled ? null : picked.assets[0];
      if (!asset) return false;
      if (asset.fileSize && asset.fileSize > MAX_BYTES) throw new ApiError(0, "too_large", "A imagem excede 10 MB. Escolha outra fotografia.");

      await uploadAvatar(asset.uri, asset.mimeType ?? "image/jpeg");
      useSessionStore.getState().setProfile(await bankApi.auth.me());
      return true;
    },
    onError: (e) => { if (__DEV__) console.warn("Upload da fotografia falhou:", e); },
  });
}

export function useRemoveAvatar() {
  return useMutation({
    mutationFn: async () => {
      await bankApi.auth.deleteAvatar();
      useSessionStore.getState().setProfile(await bankApi.auth.me());
    },
  });
}
