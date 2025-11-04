import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTheme } from "@/contexts/theme-provider";

// Define a type for the slide data to enforce type safety on the icon name
type OnboardingSlide = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  description: string;
};

const onboardingSlides: OnboardingSlide[] = [
  {
    icon: "tree-pine",
    title: "Welcome to Evergreen Focus",
    description:
      "Plant the seeds of productivity and watch your digital forest grow with every completed focus session.",
  },
  {
    icon: "timer-outline",
    title: "The Pomodoro Technique",
    description:
      "Choose a duration, start the timer, and focus completely. We'll handle the rest and reward you for your hard work.",
  },
  {
    icon: "forest",
    title: "Build Your Digital Forest",
    description:
      "Each successful session plants a tree. Stay consistent to build a lush forest and a powerful focusing habit.",
  },
  {
    icon: "rocket-launch-outline",
    title: "Ready to Grow?",
    description:
      "Create an account or continue anonymously to start your journey towards a more focused and productive life.",
  },
];

const OnboardingScreen = () => {
  const { theme } = useTheme();
  const themeColors = Colors[theme];
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleDone = () => {
    completeOnboarding();
    router.replace("/login");
  };

  const Footer = () => {
    const animatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollX.value,
        [
          (onboardingSlides.length - 2) * width,
          (onboardingSlides.length - 1) * width,
        ],
        [0, 1],
        Extrapolate.CLAMP,
      );
      const widthValue = interpolate(
        scrollX.value,
        [
          (onboardingSlides.length - 2) * width,
          (onboardingSlides.length - 1) * width,
        ],
        [100, 200],
        Extrapolate.CLAMP,
      );

      return {
        opacity,
        // Replaced withTiming for a smoother animation as requested
        width: withTiming(widthValue),
      };
    });

    return (
      <View
        style={[styles.footerContainer, { paddingBottom: insets.bottom + 20 }]}
      >
        <Pagination />
        <TouchableOpacity style={[styles.skipButton]} onPress={handleDone}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </TouchableOpacity>
        <Animated.View style={[{ alignItems: "flex-end" }, animatedStyle]}>
          <TouchableOpacity
            style={[
              styles.getStartedButton,
              { backgroundColor: themeColors.tint },
            ]}
            onPress={handleDone}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingSlides.map((_, index) => {
          const animatedStyle = useAnimatedStyle(() => {
            const dotWidth = interpolate(
              scrollX.value,
              [(index - 1) * width, index * width, (index + 1) * width],
              [10, 20, 10],
              Extrapolate.CLAMP,
            );
            const opacity = interpolate(
              scrollX.value,
              [(index - 1) * width, index * width, (index + 1) * width],
              [0.5, 1, 0.5],
              Extrapolate.CLAMP,
            );
            const color = interpolateColor(
              scrollX.value,
              [(index - 1) * width, index * width, (index + 1) * width],
              [
                themeColors.tabIconDefault,
                themeColors.tint,
                themeColors.tabIconDefault,
              ],
            );

            return {
              width: dotWidth,
              opacity,
              backgroundColor: color,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[styles.paginationDot, animatedStyle]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {onboardingSlides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={slide.icon} // This is now strictly typed
                size={150}
                color={themeColors.tint}
              />
            </View>
            <View style={styles.textContainer}>
              <ThemedText type="title" style={styles.title}>
                {slide.title}
              </ThemedText>
              <ThemedText style={styles.description}>
                {slide.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </Animated.ScrollView>
      <Footer />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 0.3,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 80,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paginationDot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  getStartedButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 99,
  },
  getStartedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OnboardingScreen;
