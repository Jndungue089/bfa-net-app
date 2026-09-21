import type { ImageSourcePropType } from "react-native";
import type { RechargeProvider } from "@bfa/shared";

export interface ProviderVisual { logo: ImageSourcePropType; bg: string; fit: "contain" | "cover" }

/** Brand artwork per provider (assets/providers). DStv's image is a full-bleed blue tile, the rest sit on white. */
export const PROVIDER_VISUALS: Record<RechargeProvider, ProviderVisual> = {
  Unitel: { logo: require("../../assets/providers/unitel.png"), bg: "#FFFFFF", fit: "contain" },
  Africell: { logo: require("../../assets/providers/africell.png"), bg: "#FFFFFF", fit: "contain" },
  Dstv: { logo: require("../../assets/providers/dstv.png"), bg: "#1D2266", fit: "cover" },
  Zap: { logo: require("../../assets/providers/zap.png"), bg: "#FFFFFF", fit: "contain" },
  Ende: { logo: require("../../assets/providers/ende.jpeg"), bg: "#FFFFFF", fit: "contain" },
};
