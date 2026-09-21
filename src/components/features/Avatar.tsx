import { useState } from "react";
import { Image, View } from "react-native";
import { T } from "@/components/ui";
import { API_URL } from "@/lib/config";
import { useSessionStore } from "@/stores/session";
import { colors } from "@/theme";

/** Profile picture from the API (bearer header), falling back to initials when absent or on error. */
export function Avatar({ name, version, size = 96 }: { name: string; version: number | null | undefined; size?: number }) {
  const token = useSessionStore((s) => s.accessToken);
  const [failed, setFailed] = useState<number | null | undefined>(undefined);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  const show = version != null && token && failed !== version;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: colors.navy800, alignItems: "center", justifyContent: "center" }}
      accessible accessibilityRole="image" accessibilityLabel={`Fotografia de ${name}`}>
      {show ? (
        <Image
          source={{ uri: `${API_URL}/api/v1/me/avatar?v=${version}`, headers: { Authorization: `Bearer ${token}` } }}
          style={{ width: size, height: size }} onError={() => setFailed(version)}
        />
      ) : <T style={{ color: "#fff", fontSize: size * 0.36, fontWeight: "700" }}>{initials || "?"}</T>}
    </View>
  );
}
