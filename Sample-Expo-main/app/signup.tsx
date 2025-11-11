import { Link, router } from "expo-router";
import {
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/theme-provider";
import { Colors } from "@/constants/theme";

export default function SignupScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { theme } = useTheme();
  const colors = Colors[theme];

  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long.",
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName);
      Alert.alert(
        "Account Created",
        "Your account has been created successfully! Please log in to continue.",
      );
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Sign Up Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Create an Account
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Join Evergreen Focus and start growing your forest
      </ThemedText>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.leafHeader}>
          <MaterialCommunityIcons name="leaf" size={28} color={colors.tint} />
          <ThemedText style={styles.leafTitle}>Evergreen Focus</ThemedText>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
          placeholder="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          placeholderTextColor={colors.tabIconDefault}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.tabIconDefault}
        />
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
                paddingRight: 48,
              },
            ]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={colors.tabIconDefault}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color={colors.tabIconDefault}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
                paddingRight: 48,
              },
            ]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            placeholderTextColor={colors.tabIconDefault}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowConfirm((v) => !v)}
            style={styles.eyeButton}
          >
            <MaterialCommunityIcons
              name={showConfirm ? "eye-off" : "eye"}
              size={22}
              color={colors.tabIconDefault}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.tint}
            style={{ marginVertical: 10 }}
          />
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleSignup}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        )}
      </View>

      <Link href="/login" style={styles.linkCenter}>
        <ThemedText type="link">Already have an account? Log in</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.8,
  },
  card: {
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  leafHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  leafTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    height: 50,
    width: "100%",
    marginVertical: 10,
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkCenter: {
    marginTop: 20,
    textAlign: "center",
  },
});
