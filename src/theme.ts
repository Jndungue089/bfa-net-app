import { Platform } from "react-native";

export const colors = {
  brand: "#F05D1A", brandDark: "#D94D0E", brandLight: "#FFE3D2", brandFaint: "#FFF4EE",
  navy900: "#0B1450", navy800: "#0D1B5E", navy700: "#1B2C85", navy50: "#EEF0FB",
  bg: "#F8FAFC", card: "#FFFFFF", text: "#1E293B", muted: "#64748B", border: "#E2E8F0", placeholder: "#94A3B8",
  danger: "#DC2626", dangerBg: "#FEF2F2", success: "#059669", successBg: "#ECFDF5", warningBg: "#FFFBEB", warning: "#B45309",
} as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Serif to echo the BFA wordmark. iOS ships Times New Roman; Android's generic `serif` maps to Noto Serif. */
export const fonts = {
  regular: Platform.select({ ios: "Times New Roman", default: "serif" }) as string,
} as const;
