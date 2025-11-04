import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useFirestore } from "@/contexts/FirestoreContext";
import { useTheme } from "@/contexts/theme-provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
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

  // Animation values
  const treeSize = useSharedValue(80);
  const glowScale = useSharedValue(0);

  const animatedTreeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: treeSize.value / 80 }], // Base size is 80
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: glowScale.value }],
      opacity: glowScale.value === 0 ? 0 : 0.3,
    };
  });

  useEffect(() => {
    let soundInstance: Audio.Sound | null = null;
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../../assets/sounds/chime.mp3"),
        );
        soundInstance = sound; // Assign to the scoped variable
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        setSound(soundInstance); // Also update state to trigger re-renders if needed
      } catch (e) {
        console.warn("Could not load chime sound:", e);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sound?.replayAsync();

    // "Grow and Glow" animation
    glowScale.value = withTiming(1.5, { duration: 400 });
    treeSize.value = withSequence(
      withTiming(150, { duration: 400 }),
      withSpring(100),
    );

    Alert.alert(
      "Session Complete!",
      "You've grown a new tree in your forest.",
      [{ text: "Awesome!", onPress: handleReset }],
      { cancelable: false },
    );
  }, [addSession, duration, sound, treeSize, glowScale, handleReset]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerState === "focusing") {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            if (interval) clearInterval(interval);
            handleSessionComplete();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
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
      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.glowEffect,
            { backgroundColor: themeColors.accent },
            animatedGlowStyle,
          ]}
        />
        <AnimatedIcon
          name={"tree-pine" as keyof typeof MaterialCommunityIcons.glyphMap}
          size={80}
          color={
            timerState === "failed" ? themeColors.destructive : themeColors.tint
          }
          style={animatedTreeStyle}
        />
      </View>

      <ThemedText style={styles.timerText}>{formatTime(timer)}</ThemedText>

      {timerState === "idle" ? (
        <View style={styles.pickerContainer}>
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Picker
              selectedValue={selectedDuration}
              style={[styles.picker, { color: themeColors.text }]}
              onValueChange={(itemValue) => setSelectedDuration(itemValue)}
              dropdownIconColor={themeColors.text}
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
      ) : (
        <View style={{ height: 100 }} />
      )}

      <View style={styles.controlsContainer}>
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
        <TouchableOpacity
          onPress={handleStartPause}
          style={[styles.button, { backgroundColor: themeColors.tint }]}
          disabled={timerState === "failed" || timerState === "celebrating"}
        >
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  focusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  animationContainer: {
    height: 250,
    width: 250,
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
  timerText: {
    fontSize: 72,
    fontWeight: Platform.OS === "ios" ? "200" : "100",
    letterSpacing: 1,
  },
  pickerContainer: {
    width: "100%",
    alignItems: "center",
    height: 100,
  },
  pickerWrapper: {
    width: "80%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 120 : 60,
  },
  input: {
    width: "40%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    textAlign: "center",
    fontSize: 16,
    marginTop: 16,
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
});

export default FocusTimer;
