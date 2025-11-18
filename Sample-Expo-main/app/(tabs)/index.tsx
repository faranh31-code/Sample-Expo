import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
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
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { AdBanner, showRewardedAd, initAds as initMobileAdsSafe } from "@/utils/ads";

export default function DashboardScreen() {
  const { user, loading: authLoading, reloadUser, logout } = useAuth();
  const { getDayStreak, loading: firestoreLoading } = useFirestore();
  const [activeTab, setActiveTab] = useState("focus");
  const { theme, toggleTheme } = useTheme();
  const themeColors = Colors[theme];
  const dayStreak = getDayStreak();
  const insets = useSafeAreaInsets();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      reloadUser?.();
      try { initMobileAdsSafe(); } catch {}
      return () => {};
    }, [reloadUser])
  );

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
      <View style={{ alignItems: "center", marginBottom: 6 }}>
        <AdBanner />
      </View>
      <View style={styles.appHeader}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setSidebarOpen(true)}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="menu" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="pine-tree" size={28} color={themeColors.tint} />
          <ThemedText style={styles.appName}>Evergreen Focus</ThemedText>
        </View>
        <ThemedText style={styles.welcomeMessage}>{welcomeMessage}</ThemedText>
        <View style={styles.profileButton}>
          <Image
            source={{ uri: user?.photoURL || "https://via.placeholder.com/120" }}
            style={styles.profileImage}
          />
        </View>
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



      <View style={[styles.segmentedContainer, { borderColor: themeColors.border }] }>
        <TouchableOpacity
          onPress={() => setActiveTab("focus")}
          accessibilityRole="button"
          style={[
            styles.segment,
            activeTab === "focus" && {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
        >
          <MaterialCommunityIcons
            name="leaf"
            size={16}
            color={activeTab === "focus" ? themeColors.tint : themeColors.tabIconDefault}
            style={{ marginRight: 6 }}
          />
          <ThemedText style={[styles.segmentText, activeTab !== "focus" && { color: themeColors.tabIconDefault } ]}>Focus</ThemedText>
        </TouchableOpacity>
        <View
          style={[
            styles.segment,
            activeTab === "history" && {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="forest"
            size={16}
            color={activeTab === "history" ? themeColors.tint : themeColors.tabIconDefault}
            style={{ marginRight: 6 }}
          />
          <TouchableOpacity onPress={() => setActiveTab("history")} accessibilityRole="button">
            <ThemedText style={[styles.segmentText, activeTab !== "history" && { color: themeColors.tabIconDefault } ]}>Forest History</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === "focus" ? (
          <ScrollView
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <FocusTimer />
          </ScrollView>
        ) : (
          <HistoryView />
        )}
      </View>

      {sidebarOpen && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSidebarOpen(false)} />
          <LinearGradient
            colors={[themeColors.card, themeColors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sidebar}
          >
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Image
                source={{ uri: user?.photoURL || "https://via.placeholder.com/120" }}
                style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: themeColors.border }}
              />
              <ThemedText type="subtitle" style={{ marginTop: 8 }}>{user?.displayName || "Anonymous"}</ThemedText>
              {!user?.isAnonymous && (
                <ThemedText style={{ opacity: 0.7 }}>{user?.email}</ThemedText>
              )}
            </View>

            <TouchableOpacity
              onPress={async () => {
                setSidebarOpen(false);
                try { await showRewardedAd(); } catch {}
                router.push("/(tabs)/settings");
              }}
              style={[styles.drawerItem, { borderColor: themeColors.border }]}
            >
              <MaterialCommunityIcons name="cog" size={20} color={themeColors.text} />
              <ThemedText style={styles.drawerText}>Settings</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { toggleTheme(); }}
              style={[styles.drawerItem, { borderColor: themeColors.border }]}
            >
              <MaterialCommunityIcons name={theme === "dark" ? "weather-night" : "weather-sunny"} size={20} color={themeColors.text} />
              <ThemedText style={styles.drawerText}>Toggle Theme</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSidebarOpen(false); logout(); }}
              style={[styles.drawerItem, { borderColor: themeColors.border }]}
            >
              <MaterialCommunityIcons name="logout" size={20} color={themeColors.text} />
              <ThemedText style={styles.drawerText}>Log Out</ThemedText>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
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
    justifyContent: "center",
  },
  menuButton: {
    position: "absolute",
    left: 20,
    top: 8,
    zIndex: 2,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
  profileButton: {
    position: "absolute",
    right: 20,
    top: 8,
  },
  iconPill: {
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
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
  segmentedContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 10 : 0,
  },
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    flexDirection: "row",
  },
  sidebar: {
    width: 280,
    paddingVertical: 16,
    paddingTop: 30,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  drawerText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Removed timer outer card wrapper
});
