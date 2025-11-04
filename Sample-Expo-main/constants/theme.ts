/**
 * ============================================================================
 * EVERGREEN FOCUS THEME
 * ============================================================================
 *
 * This file defines the color palette for the "Evergreen Focus" application.
 * It includes a professional, nature-inspired light theme (default) and a
 * complementary dark theme. The colors are chosen for their calming aesthetic,
 * visual appeal, and accessibility.
 *
 * Each theme object contains a set of color properties that are used
 * throughout the application to ensure a consistent and beautiful UI.
 */

export interface ThemeColors {
  text: string;
  background: string;
  card: string;
  border: string;
  tint: string; // Primary action color (e.g., buttons)
  accent: string; // Success states, highlights, secondary actions
  destructive: string; // Errors, warnings, destructive actions
  tabIconDefault: string;
  tabIconSelected: string;
  icon: string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  // The default theme for the application.
  // Inspired by a bright, airy forest with natural light.
  light: {
    text: "#1C2B28", // Dark Slate Green - High contrast for readability
    background: "#F4F7F6", // Whisper White - A soft, off-white background
    card: "#FFFFFF", // Pure White - For cards and elevated surfaces
    border: "#E1E5E4", // Light Grey - Subtle borders for inputs and separators
    tint: "#3A8E7E", // Deep Sea Green - The primary, calming action color
    accent: "#58C2AD", // Tealish Green - A brighter accent for success and highlights
    destructive: "#E76F51", // Burnt Sienna - A warm, noticeable color for errors
    tabIconDefault: "#A9B4B1", // Muted Grey-Green for inactive icons
    tabIconSelected: "#3A8E7E", // Use the tint color for active/selected icons
    icon: "#1C2B28" // Default icon color for light theme
  },

  // The dark theme for the application.
  // Inspired by a tranquil forest at dusk.
  dark: {
    text: "#EAECEB", // Light Grey - Soft and readable text on dark backgrounds
    background: "#121816", // Deep Forest Night - A very dark, almost black green
    card: "#1C2B28", // Dark Slate Green - For cards and elevated surfaces
    border: "#2A3F3A", // Darker green-grey for subtle borders
    tint: "#58C2AD", // Use the lighter accent as the primary tint for better visibility
    accent: "#3A8E7E", // The deeper green now serves as a secondary accent
    destructive: "#F28482", // A slightly brighter, softer red for dark mode
    tabIconDefault: "#7E8C88", // Muted Grey-Green for inactive icons
    tabIconSelected: "#58C2AD", // Use the tint color for active/selected icons
    icon: "#EAECEB" // Default icon color for dark theme
  },
};
