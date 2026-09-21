import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme";

interface Props {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Skip the top inset when a navigation header is already shown. */
  edges?: ("top" | "bottom")[];
  padded?: boolean;
}

export function Screen({ children, onRefresh, refreshing = false, edges = ["top"], padded = true }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <ScrollView
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[padded && styles.pad, { gap: 16 }]}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} /> : undefined}
      >
        {children}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg }, pad: { padding: 16 } });
