import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * ============================================================================
 * ONBOARDING CONTEXT
 * ============================================================================
 *
 * This context manages the state of the user's onboarding process. It checks
 * if the user has completed the onboarding flow by looking for a flag in
 * AsyncStorage. This allows the app to decide whether to show the onboarding
 * screens or the main application on startup.
 *
 * - `isLoading`: A boolean flag that is true while the context is checking
 *   AsyncStorage. This is useful for preventing screen flashes.
 * - `hasOnboarded`: A boolean that is true if the user has completed the
 *   onboarding process.
 * - `completeOnboarding`: A function to call when the user finishes the
 *   onboarding flow. This sets `hasOnboarded` to true and persists this
 *   state to AsyncStorage.
 */

const ONBOARDING_STORAGE_KEY = "@EvergreenFocus:hasOnboarded";

interface OnboardingContextType {
  hasOnboarded: boolean;
  isLoading: boolean;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (value !== null && value === "true") {
          setHasOnboarded(true);
        }
      } catch (e) {
        console.error("Failed to fetch onboarding status from storage", e);
      } finally {
        // Use a small delay to prevent splash screen flickering
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    checkOnboardingStatus();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      setHasOnboarded(true);
    } catch (e) {
      console.error("Failed to save onboarding status to storage", e);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{ hasOnboarded, isLoading, completeOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
