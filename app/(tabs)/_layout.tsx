import type { ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSecureScreen } from "@/hooks/useSecureScreen";
import { colors, fonts } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const tab = (title: string, icon: IconName, iconFocused: IconName) => ({
  title,
  tabBarIcon: ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => <Ionicons name={focused ? iconFocused : icon} size={size + 1} color={color} />,
});

export default function TabsLayout() {
  useSecureScreen(); // financial data must not end up in screenshots or screen recordings
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: colors.brand, tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontSize: 12, fontWeight: "600", fontFamily: fonts.regular }, tabBarStyle: { borderTopColor: colors.border },
    }}>
      <Tabs.Screen name="index" options={tab("Resumo", "home-outline", "home")} />
      <Tabs.Screen name="services" options={tab("Serviços", "grid-outline", "grid")} />
      <Tabs.Screen name="assistant" options={tab("Assistente", "sparkles-outline", "sparkles")} />
      <Tabs.Screen name="cards" options={tab("Cartões", "card-outline", "card")} />
      <Tabs.Screen name="profile" options={tab("Perfil", "person-outline", "person")} />
    </Tabs>
  );
}
