import "react-native-gesture-handler";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { enableScreens } from "react-native-screens";
import { Stack } from "expo-router";

import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FirestoreProvider } from "@/contexts/FirestoreContext";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/contexts/OnboardingContext";
import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from "@/contexts/theme-provider";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useEffect } from "react";
import { initMobileAds } from "@/utils/ads";

enableScreens(true);

function AppContent() {
  const { loading: authLoading } = useAuth();
  const { isLoading: onboardingLoading } = useOnboarding();
  useProtectedRoute();

  const { theme } = useTheme();
  const navigationTheme = theme === "dark" ? DarkTheme : DefaultTheme;

  useEffect(() => {
    initMobileAds();
  }, []);

  // This check is crucial. It prevents the UI from rendering and flashing
  // a screen (e.g., login) before the protected route hook has a chance
  // to run its redirection logic. It effectively waits for the authentication
  // and onboarding status to be determined.
  if (authLoading || onboardingLoading) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <FirestoreProvider>
          <OnboardingProvider>
            <AppContent />
          </OnboardingProvider>
        </FirestoreProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}
