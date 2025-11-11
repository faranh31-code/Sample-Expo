import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useFirestore } from "@/contexts/FirestoreContext";
import { useTheme } from "@/contexts/theme-provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import ConfettiCannon from "react-native-confetti-cannon";
import { LinearGradient } from "expo-linear-gradient";
// Picker removed; using chips instead
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Picker } from "@react-native-picker/picker";
import { showInterstitialAd, showRewardedAd } from "@/utils/ads";

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

const FocusTimer = () => {
  const { addSession } = useFirestore();
  const { theme } = useTheme();
  const themeColors = Colors[theme];

  const [selectedDuration, setSelectedDuration] = useState<string>("25");
  const [customDuration, setCustomDuration] = useState<string>("");
  const [duration, setDuration] = useState<number>(25);

  const [timer, setTimer] = useState(duration * 60);
  const [timerState, setTimerState] = useState<
    "idle" | "focusing" | "paused" | "failed" | "celebrating"
  >("idle");
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  // Animation values
  const treeSize = useSharedValue(80);
  const glowScale = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const animatedTreeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: treeSize.value / 80 }], // Base size is 80
    };
  });

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: glowScale.value }],
      opacity: glowScale.value === 0 ? 0 : 0.3,
    };
  });

  // Progress ring metrics
  const ringRadius = 92;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * ringRadius;
  const totalSeconds = Math.max(1, duration * 60);
  const progress = 1 - timer / totalSeconds; // 0..1
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    let soundInstance: Audio.Sound | null = null;
    async function loadSound() {
      try {
        // Optional sound. If the asset is missing, we'll silently continue.
        const { sound } = await Audio.Sound.createAsync(
          // @ts-ignore - path may not exist; wrapped in try/catch
          require("../../../assets/sounds/chime.mp3")
        );
        soundInstance = sound; // Assign to the scoped variable
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        setSound(soundInstance); // Also update state to trigger re-renders if needed
      } catch (e) {
        // No-op if sound asset is missing
      }
    }
    loadSound();

    // The cleanup function closes over soundInstance, which will be correctly assigned
    // when the async function completes.
    return () => {
      if (soundInstance) {
        soundInstance.unloadAsync().catch(console.error);
      }
    };
  }, []); // This effect should only run once on mount.

  const handleReset = useCallback(() => {
    setTimerState("idle");
    setTimer(duration * 60);
    treeSize.value = withSpring(80);
    glowScale.value = withTiming(0);
  }, [duration, treeSize, glowScale]);

  const handleSessionComplete = useCallback(async () => {
    setTimerState("celebrating");
    await addSession(duration, "Completed");
    try { await showRewardedAd(); } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sound?.replayAsync();

    // "Grow and Glow" animation
    glowScale.value = withTiming(1.5, { duration: 400 });
    treeSize.value = withSequence(
      withTiming(150, { duration: 400 }),
      withSpring(100),
    );
    setShowCelebration(true);
    setConfettiKey((k) => k + 1);
  }, [addSession, duration, sound, treeSize, glowScale, handleReset]);

  const intervalRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    // Always clear any existing interval before making changes
    if (intervalRef.current) {
      clearInterval(intervalRef.current as unknown as number);
      intervalRef.current = null;
    }

    if (timerState === "focusing") {
      intervalRef.current = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current as unknown as number);
              intervalRef.current = null;
            }
            handleSessionComplete();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000) as unknown as NodeJS.Timer;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as unknown as number);
        intervalRef.current = null;
      }
    };
  }, [timerState, handleSessionComplete]);

  // Effect to handle tree growth animation during focus
  useEffect(() => {
    if (timerState === "focusing") {
      const totalSeconds = duration * 60;
      const elapsedSeconds = totalSeconds - timer;
      const progress = elapsedSeconds / totalSeconds;
      const newSize = 80 + progress * 100; // Grows from 80 to 180
      treeSize.value = withTiming(newSize, { duration: 1000 });
    }
  }, [timer, timerState, duration, treeSize]);

  useEffect(() => {
    const newDuration =
      selectedDuration === "custom"
        ? parseInt(customDuration, 10) || 0
        : parseInt(selectedDuration, 10);
    setDuration(newDuration);
  }, [selectedDuration, customDuration]);

  useEffect(() => {
    if (timerState === "idle") {
      setTimer(duration * 60);
    }
  }, [duration, timerState]);

  const handleStartPause = () => {
    if (duration <= 0) {
      Alert.alert("Invalid Duration", "Please set a positive duration.");
      return;
    }
    if (timerState === "idle") setTimerState("focusing");
    else if (timerState === "focusing") setTimerState("paused");
    else if (timerState === "paused") setTimerState("focusing");
  };

  const handleGiveUp = () => {
    Alert.alert(
      "Give Up?",
      "Are you sure you want to end this session? The tree will wither.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Give Up",
          style: "destructive",
          onPress: async () => {
            setTimerState("failed");
            await addSession(duration, "Failed");
            try { await showRewardedAd(); } catch {}
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            treeSize.value = withSpring(70);
            setTimeout(handleReset, 2000);
          },
        },
      ],
    );
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getButtonText = () => {
    switch (timerState) {
      case "idle":
        return "Start Focusing";
      case "focusing":
        return "Pause";
      case "paused":
        return "Resume";
      case "failed":
        return "Session Failed";
      case "celebrating":
        return "Well Done!";
      default:
        return "Start";
    }
  };

  return (
    <View style={styles.focusContainer}>
      {showCelebration && (
        <ConfettiCannon key={confettiKey} count={120} origin={{ x: 0, y: 0 }} fadeOut explosionSpeed={400} fallSpeed={2000} />
      )}
      {/* Leaf icon with subtle glow animation above the timer */}
      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.glowEffect,
            { backgroundColor: themeColors.tint },
            animatedGlowStyle,
          ]}
        />
        <AnimatedIcon
          name={"leaf" as keyof typeof MaterialCommunityIcons.glyphMap}
          size={80}
          color={themeColors.tint}
          style={animatedTreeStyle}
        />
      </View>

      <View style={[styles.neumorphicCard]}> 
        <LinearGradient
          colors={[themeColors.card, themeColors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientSurface}
        >
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Svg height={(ringRadius + strokeWidth) * 2} width={(ringRadius + strokeWidth) * 2}>
            <Defs>
              <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={themeColors.tint} stopOpacity="1" />
                <Stop offset="100%" stopColor={themeColors.accent} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={ringRadius + strokeWidth}
              cy={ringRadius + strokeWidth}
              r={ringRadius}
              stroke={themeColors.border}
              strokeWidth={strokeWidth}
              opacity={0.5}
              fill="none"
            />
            <Circle
              cx={ringRadius + strokeWidth}
              cy={ringRadius + strokeWidth}
              r={ringRadius}
              stroke="url(#ringGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              rotation="-90"
              originX={ringRadius + strokeWidth}
              originY={ringRadius + strokeWidth}
              fill="none"
            />
          </Svg>
          <View style={styles.timerOverlay}> 
            <ThemedText style={[styles.timerText, { color: themeColors.text }]}>{formatTime(timer)}</ThemedText>
          </View>
        </View>
        </LinearGradient>
      </View>

      {timerState === "idle" ? (
        <View style={styles.pickerContainer}>
          <View style={{
            width: "80%",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: themeColors.border,
            backgroundColor: themeColors.card,
            overflow: "hidden",
          }}>
            <Picker
              selectedValue={selectedDuration}
              onValueChange={(v) => setSelectedDuration(String(v))}
              dropdownIconColor={themeColors.text}
              style={{ color: themeColors.text }}
            >
              <Picker.Item label="10 minutes" value="10" />
              <Picker.Item label="25 minutes" value="25" />
              <Picker.Item label="50 minutes" value="50" />
              <Picker.Item label="Custom" value="custom" />
            </Picker>
          </View>
          {selectedDuration === "custom" && (
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text,
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.card,
                },
              ]}
              placeholder="Mins"
              placeholderTextColor={themeColors.tabIconDefault}
              keyboardType="number-pad"
              value={customDuration}
              onChangeText={setCustomDuration}
            />
          )}
        </View>
      ) : null}

      <View style={[styles.controlsContainer, { marginTop: 80 } ]}>
        {(timerState === "focusing" || timerState === "paused") && (
          <View style={styles.secondaryControls}>
            <TouchableOpacity onPress={handleReset} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="restart"
                size={28}
                color={themeColors.tabIconDefault}
              />
            </TouchableOpacity>
          </View>
        )}
        <AnimatedTouchable
          onPress={async () => {
            // Button press feedback
            buttonScale.value = withSequence(withSpring(0.96), withSpring(1));
            if (duration <= 0) {
              Alert.alert("Invalid Duration", "Please set a positive duration.");
              return;
            }
            if (timerState === "idle") {
              try { await showInterstitialAd(); } catch {}
            }
            handleStartPause();
          }}
          style={[styles.button, { backgroundColor: themeColors.tint }, animatedButtonStyle]}
          disabled={timerState === "failed" || timerState === "celebrating"}
        >
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        </AnimatedTouchable>
        {(timerState === "focusing" || timerState === "paused") && (
          <View style={styles.secondaryControls}>
            <TouchableOpacity onPress={handleGiveUp} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="cancel"
                size={28}
                color={themeColors.destructive}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCelebration(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.card }] }>
            <AnimatedIcon
              name={"pine-tree" as keyof typeof MaterialCommunityIcons.glyphMap}
              size={96}
              color={themeColors.tint}
              style={{ marginBottom: 12 }}
            />
            <ThemedText type="title" style={{ textAlign: "center", color: themeColors.tint }}>Plant Thrived!</ThemedText>
            <ThemedText style={{ textAlign: "center", opacity: 0.8, marginTop: 6 }}>
              Congratulations on completing your focus session.
            </ThemedText>
            <TouchableOpacity
              onPress={() => { setShowCelebration(false); handleReset(); }}
              style={[styles.button, { backgroundColor: themeColors.tint, marginTop: 16 }]}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  focusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  animationContainer: {
    height: 280,
    width: 280,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowEffect: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  gradientSurface: {
    borderRadius: 20,
    padding: 16,
  },
  neumorphicCard: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  timerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  timerWrapper: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 54,
    fontWeight: Platform.OS === "ios" ? "600" : "600",
    letterSpacing: 1.5,
    lineHeight: 58,
    // @ts-ignore RN supports this prop on iOS/Android for monospaced digits
    fontVariant: ["tabular-nums"],
  },
  pickerContainer: {
    width: "100%",
    alignItems: "center",
    height: 100,
    paddingTop: 30,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    width: "40%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    textAlign: "center",
    fontSize: 16,
    marginTop: 16,
    paddingBottom: 20,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    flex: 2.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  secondaryControls: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  glowContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  glowHalo: {
    position: "absolute",
    top: 4,
    left: 16,
    right: 16,
    bottom: 4,
    borderRadius: 24,
    opacity: 0.25,
    // iOS shadow
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    // Android shadow
    elevation: 16,
  },
});

export default FocusTimer;
