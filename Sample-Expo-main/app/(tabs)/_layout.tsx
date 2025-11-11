import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { useTheme } from "@/contexts/theme-provider";
import { Colors } from "@/constants/theme";

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Focus",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome size={size} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome size={size} name="cog" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
