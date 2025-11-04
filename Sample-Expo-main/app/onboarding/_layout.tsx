import { Stack } from 'expo-router';
import React from 'react';

/**
 * ============================================================================
 * ONBOARDING LAYOUT
 * ============================================================================
 * This file defines the navigation structure for the onboarding flow.
 *
 * - It uses a Stack navigator from expo-router to manage the onboarding screens.
 * - The header is hidden to allow for a custom, full-screen UI design on the
 *   onboarding slides.
 */
export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
