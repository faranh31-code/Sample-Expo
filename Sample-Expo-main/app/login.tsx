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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const colors = Colors[theme];

  const { signIn, signInAnonymously } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password.",
      );
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Error", "Could not sign in anonymously. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome Back!
      </ThemedText>
      <ThemedText style={styles.subtitle}>Sign in to your forest</ThemedText>

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

        <Link href={{ pathname: "/forgot-password" }} style={styles.linkRight}>
          <ThemedText type="link">Forgot your password?</ThemedText>
        </Link>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.tint}
            style={{ marginVertical: 10 }}
          />
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          styles.anonymousButton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={handleAnonymousLogin}
        disabled={loading}
      >
        <ThemedText style={styles.anonymousButtonText}>
          Continue Anonymously
        </ThemedText>
      </TouchableOpacity>

      <Link href={{ pathname: "/signup" }} style={styles.linkCenter}>
        <ThemedText type="link">Don't have an account? Sign up</ThemedText>
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
  anonymousButton: {
    borderWidth: 1,
  },
  anonymousButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  linkCenter: {
    marginTop: 20,
    textAlign: "center",
  },
  linkRight: {
    alignSelf: "flex-end",
    marginVertical: 10,
  },
});
