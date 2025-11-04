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
 * THEME PROVIDER
 * ============================================================================
 *
 * This context manages the application's theme (light/dark mode).
 *
 * - It defaults to the 'light' theme as per the design requirements.
 * - It persists the user's selected theme to AsyncStorage.
 * - It loads the saved theme on app startup to maintain user preference.
 * - It provides a `useTheme` hook for easy access to the current theme
 *   and the `toggleTheme` function from any component.
 */

// Define the shape of the context's value
interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define the props for the ThemeProvider component
interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = "@EvergreenFocus:theme";

// Create the provider component
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Default theme is set to 'light'.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  useEffect(() => {
    // This effect runs once on mount to load the saved theme.
    const loadThemeFromStorage = async () => {
      try {
        const savedTheme = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as
          | "light"
          | "dark"
          | null;

        if (savedTheme) {
          setTheme(savedTheme);
        }
        // If no theme is saved, it will correctly default to the 'light' state.
      } catch (error) {
        console.error("Failed to load theme from async storage.", error);
      } finally {
        setIsLoadingTheme(false);
      }
    };

    loadThemeFromStorage();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Failed to save theme to async storage.", error);
    }
  };

  // Prevents a flash of the default theme before the stored theme is loaded.
  // The root layout's splash screen should handle this visually.
  if (isLoadingTheme) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to easily consume the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
