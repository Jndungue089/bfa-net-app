import { Stack } from "expo-router";
import { colors, fonts } from "@/theme";

export default function PayLayout() {
  return (
    <Stack screenOptions={{
      headerTintColor: colors.navy800, headerBackTitle: "Voltar", headerShadowVisible: false,
      headerStyle: { backgroundColor: colors.bg }, headerTitleStyle: { fontFamily: fonts.regular, fontWeight: "700", fontSize: 19 },
      contentStyle: { backgroundColor: colors.bg },
    }}>
      <Stack.Screen name="services" options={{ title: "Pagamento de serviços" }} />
      <Stack.Screen name="reference" options={{ title: "Pagamento por referência" }} />
      <Stack.Screen name="state" options={{ title: "Pagamentos ao Estado" }} />
      <Stack.Screen name="recharges/index" options={{ title: "Carregamentos" }} />
      <Stack.Screen name="recharges/[provider]" options={{ title: "Carregamento" }} />
      <Stack.Screen name="qr" options={{ title: "Compra com QR Code" }} />
      <Stack.Screen name="transfers/index" options={{ title: "Transferências" }} />
      <Stack.Screen name="transfers/iban" options={{ title: "Por IBAN" }} />
      <Stack.Screen name="transfers/kwik/index" options={{ title: "KWiK" }} />
      <Stack.Screen name="transfers/kwik/key" options={{ title: "Chave KWiK" }} />
      <Stack.Screen name="transfers/kwik/qr" options={{ title: "KWiK por QR Code" }} />
    </Stack>
  );
}
