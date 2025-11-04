import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestore } from "@/contexts/FirestoreContext";
import { useTheme } from "@/contexts/theme-provider";
import { Colors } from "@/constants/theme";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import FocusTimer from "@/components/dashboard/FocusTimer";
import HistoryView from "@/components/dashboard/HistoryView";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const { user, loading: authLoading } = useAuth();
  const { getDayStreak, loading: firestoreLoading } = useFirestore();
  const [activeTab, setActiveTab] = useState("focus");
  const { theme } = useTheme();
  const themeColors = Colors[theme];
  const dayStreak = getDayStreak();
  const insets = useSafeAreaInsets();
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    if (user) {
      if (user.isAnonymous) {
        setWelcomeMessage("Welcome, Grower!");
        return;
      }

      const creationTime = user.metadata?.creationTime
        ? new Date(user.metadata.creationTime).getTime()
        : 0;
      const lastSignInTime = user.metadata?.lastSignInTime
        ? new Date(user.metadata.lastSignInTime).getTime()
        : 0;

      // If the account was created within the last 2 minutes, it's a new user
      const isNewUser = lastSignInTime - creationTime < 1000 * 60 * 2;
      const displayName = user.displayName || "User";

      if (isNewUser) {
        setWelcomeMessage(`Welcome, ${displayName}!`);
      } else {
        setWelcomeMessage(`Welcome back, ${displayName}!`);
      }
    }
  }, [user]);

  if (authLoading || firestoreLoading) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.appHeader}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons
            name="pine-tree"
            size={28}
            color={themeColors.tint}
          />
          <ThemedText style={styles.appName}>Evergreen Focus</ThemedText>
        </View>
        <ThemedText style={styles.welcomeMessage}>{welcomeMessage}</ThemedText>
      </View>

      <View style={styles.header}>
        <View
          style={[
            styles.streakContainer,
            { backgroundColor: themeColors.card },
          ]}
        >
          <FontAwesome5
            name="fire-alt"
            size={24}
            color={dayStreak > 0 ? "#E76F51" : themeColors.tabIconDefault}
          />
          <View style={{ marginLeft: 12 }}>
            <ThemedText style={styles.streakText}>{dayStreak}</ThemedText>
            <ThemedText style={styles.streakLabel}>Day Streak</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("focus")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab !== "focus" && { color: themeColors.tabIconDefault },
            ]}
          >
            Focus
          </ThemedText>
          {activeTab === "focus" && (
            <View
              style={[
                styles.activeTabIndicator,
                { backgroundColor: themeColors.tint },
              ]}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("history")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab !== "history" && { color: themeColors.tabIconDefault },
            ]}
          >
            Forest History
          </ThemedText>
          {activeTab === "history" && (
            <View
              style={[
                styles.activeTabIndicator,
                { backgroundColor: themeColors.tint },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === "focus" ? <FocusTimer /> : <HistoryView />}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  appHeader: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
  appName: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 8,
  },
  welcomeMessage: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: "center",
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999, // Pill shape
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  streakText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  streakLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: -4,
  },
  tabSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    marginHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  activeTabIndicator: {
    height: 3,
    width: "60%",
    borderRadius: 2,
    position: "absolute",
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 10 : 0,
  },
});
