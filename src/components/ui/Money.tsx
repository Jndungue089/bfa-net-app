import { formatMoney } from "@bfa/shared";
import { usePrivacyStore } from "@/stores/privacy";
import { T } from "./Text";
import type { TextProps } from "react-native";

/** Amount that becomes bullets when "ocultar saldos" is on. `always` for values the user just entered. */
export function Money({ value, currency = "AOA", signed, always, ...rest }: TextProps & { value: number; currency?: string; signed?: boolean; always?: boolean; variant?: "display" | "heading" | "body" | "caption"; color?: string }) {
  const hide = usePrivacyStore((s) => s.hide);
  return <T {...rest} accessibilityLabel={hide && !always ? "Valor oculto" : undefined}>{hide && !always ? "•••••• Kz" : formatMoney(value, currency, { sign: signed })}</T>;
}
