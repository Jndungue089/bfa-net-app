import { Image, View } from "react-native";
import { colors } from "@/theme";
import { T } from "./Text";

const RATIO = 371 / 144; // cropped logo aspect

/** BFA mark, a thin divider and "NET" — the product wordmark. `height` is the logo height in dp. */
export function BrandLockup({ height = 44 }: { height?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }} accessible accessibilityRole="image" accessibilityLabel="BFA NET">
      <Image source={require("../../../assets/logo-mark.png")} style={{ height, width: height * RATIO }} resizeMode="contain" />
      <View style={{ width: 1, height: height * 0.85, backgroundColor: "rgba(13,27,94,0.4)" }} />
      <T style={{ fontSize: height * 0.62, fontWeight: "700", letterSpacing: height * 0.11, color: colors.brandDark, lineHeight: height * 0.75 }}>NET</T>
    </View>
  );
}
