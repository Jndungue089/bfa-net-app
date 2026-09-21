import type { ComponentProps } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "@/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/** Thin wrapper so every screen uses the same icon set, default colour and accessibility handling. */
export function Icon({ name, size = 22, color = colors.navy800 }: { name: IconName; size?: number; color?: ColorValue }) {
  return <Ionicons name={name} size={size} color={color} accessible={false} importantForAccessibility="no" />;
}

/** Face ID / facial recognition glyph (not in Ionicons). */
export function FaceIcon({ size = 22, color = colors.navy800 }: { size?: number; color?: ColorValue }) {
  return <MaterialCommunityIcons name="face-recognition" size={size} color={color} />;
}
