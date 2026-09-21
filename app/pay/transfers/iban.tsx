import { useLocalSearchParams, useRouter } from "expo-router";
import { isValidIban, normalizeIban } from "@bfa/shared";
import { FlowScreen } from "@/components/features/FlowScreen";
import { TransferForm } from "@/components/features/TransferForm";
import { Button, Card } from "@/components/ui";
import { View } from "react-native";

export default function TransferByIban() {
  const router = useRouter();
  const { to } = useLocalSearchParams<{ to?: string }>();
  const preset = normalizeIban(to ?? "");
  return (
    <FlowScreen>
      {(done) => (
        <>
          <View style={{ alignItems: "flex-end" }}>
            <Button title="Beneficiários" variant="ghost" onPress={() => router.push("/beneficiaries")} />
          </View>
          <Card><TransferForm presetIban={isValidIban(preset) ? preset : undefined} onDone={done} /></Card>
        </>
      )}
    </FlowScreen>
  );
}
