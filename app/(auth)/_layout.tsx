import { Stack } from "expo-router";
import { useSessionStore } from "@/stores/session";

export default function AuthLayout() {
  const status = useSessionStore((s) => s.status);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === "anonymous"}><Stack.Screen name="login" /></Stack.Protected>
      <Stack.Protected guard={status === "locked"}><Stack.Screen name="unlock" /></Stack.Protected>
    </Stack>
  );
}
