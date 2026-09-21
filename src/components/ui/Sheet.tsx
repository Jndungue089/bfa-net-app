import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "@/theme";
import { IconButton } from "./IconButton";
import { T } from "./Text";

/**
 * Bottom sheet that slides up from the bottom edge. Content scrolls when taller than 85% of the screen.
 * `dismissible=false` while an operation is in flight.
 */
export function Sheet({ visible, onClose, title, children, dismissible = true }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; dismissible?: boolean }) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => dismissible && onClose()} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <Pressable style={styles.backdrop} onPress={() => dismissible && onClose()} accessibilityLabel="Fechar" />
        <SafeAreaView edges={["bottom"]} style={[styles.sheet, { maxHeight: height * 0.88 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <T variant="heading" style={{ flex: 1 }}>{title}</T>
            {dismissible ? <IconButton icon="close" label="Fechar" onPress={onClose} color={colors.muted} /> : null}
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, gap: 16 }}>
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(7,13,54,0.55)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: radius.lg + 6, borderTopRightRadius: radius.lg + 6, paddingHorizontal: 20 },
  handle: { alignSelf: "center", width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 10, marginBottom: 6 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8, minHeight: 44 },
});
