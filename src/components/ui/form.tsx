import { useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { colors, fonts, radius } from "@/theme";
import { Sheet } from "./Sheet";
import { T } from "./Text";

interface Base<F extends FieldValues> { control: Control<F, any, any>; name: Path<F>; label: string; hint?: string }

function Frame({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <T variant="label">{label}</T>
      {children}
      {error ? <T variant="caption" color={colors.danger} accessibilityRole="alert">{error}</T> : hint ? <T variant="caption">{hint}</T> : null}
    </View>
  );
}

const inputStyle = (invalid: boolean, focused: boolean) => [styles.input, invalid && { borderColor: colors.danger }, focused && !invalid && { borderColor: colors.brand }];

type TextFieldProps<F extends FieldValues> = Base<F> & Omit<TextInputProps, "value" | "onChangeText" | "onBlur"> & { /** true = show/hide toggle, "always" = always masked (PIN) */ secure?: boolean | "always"; sanitize?: (v: string) => string; suffix?: string; align?: "left" | "right" | "center" };

/** react-hook-form-bound text input. `sanitize` runs on every keystroke so the form value is always clean. */
export function FormText<F extends FieldValues>({ control, name, label, hint, secure, sanitize, suffix, align, style, ...rest }: TextFieldProps<F>) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <Frame label={label} hint={hint} error={fieldState.error?.message}>
        <View>
          <TextInput
            {...rest} value={field.value ?? ""} secureTextEntry={secure === "always" || (!!secure && !visible)} placeholderTextColor={colors.placeholder}
            onChangeText={(v) => field.onChange(sanitize ? sanitize(v) : v)} onBlur={() => { setFocused(false); field.onBlur(); }} onFocus={() => setFocused(true)}
            accessibilityLabel={label} style={[...inputStyle(!!fieldState.error, focused), { textAlign: align ?? "left", paddingRight: secure === true || suffix ? 64 : 14 }, style]}
          />
          {secure === true && <Pressable onPress={() => setVisible((v) => !v)} style={styles.adorn} accessibilityRole="button"><T variant="caption" color={colors.navy700}>{visible ? "Ocultar" : "Mostrar"}</T></Pressable>}
          {suffix && <View style={styles.adorn} pointerEvents="none"><T variant="caption">{suffix}</T></View>}
        </View>
      </Frame>
    )} />
  );
}

export function FormPin<F extends FieldValues>(p: Base<F>) {
  return (
    <FormText {...p} secure="always" keyboardType="number-pad" maxLength={6} autoComplete="off" autoCorrect={false} textContentType="none" importantForAutofill="no"
      sanitize={(v) => v.replace(/\D/g, "").slice(0, 6)} placeholder="••••••" align="center" style={{ letterSpacing: 8, fontSize: 20 }} />
  );
}

export function FormMoney<F extends FieldValues>(p: Base<F>) {
  return <FormText {...p} keyboardType="decimal-pad" placeholder="0,00" suffix="Kz" align="right" sanitize={(v) => v.replace(/[^\d\s.,]/g, "")} autoComplete="off" />;
}

export interface Option { value: string; label: string; sub?: string }

export function FormPicker<F extends FieldValues>({ control, name, label, options, placeholder = "Seleccione…", onPick }: Base<F> & { options: Option[]; placeholder?: string; onPick?: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => {
      const selected = options.find((o) => o.value === field.value);
      return (
        <Frame label={label} error={fieldState.error?.message}>
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label} style={[...inputStyle(!!fieldState.error, false), styles.picker]}>
            <T style={{ color: selected ? colors.text : colors.placeholder }} numberOfLines={1}>{selected?.label ?? placeholder}</T>
            <T color={colors.muted}>⌄</T>
          </Pressable>
          <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
            <FlatList data={options} keyExtractor={(o) => o.value} style={{ maxHeight: 360 }} ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
              renderItem={({ item }) => (
                <Pressable onPress={() => { field.onChange(item.value); onPick?.(item.value); setOpen(false); }} style={{ paddingVertical: 14 }} accessibilityRole="button">
                  <T style={item.value === field.value ? { color: colors.brand, fontWeight: "700" } : undefined}>{item.label}</T>
                  {item.sub ? <T variant="caption">{item.sub}</T> : null}
                </Pressable>
              )} />
          </Sheet>
        </Frame>
      );
    }} />
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, backgroundColor: "#fff", fontSize: 16.5, fontFamily: fonts.regular, color: colors.text },
  adorn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
});
