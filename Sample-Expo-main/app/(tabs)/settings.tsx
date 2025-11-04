import React, { useState } from "react";
// Corrected imports - all core components from 'react-native'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

// App-specific imports
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/theme-provider";
import { storage } from "@/firebaseConfig";

// Define a type for the modal content for better type safety
type ModalContentType = {
  title: string;
  text: string;
};

export default function SettingsScreen() {
  const { user, logout, updateProfileInfo, updatePassword, deleteAccount } =
    useAuth();
  const { theme, toggleTheme } = useTheme();
  const themeColors = Colors[theme];

  // State variables with explicit types
  const [displayName, setDisplayName] = useState<string>(
    user?.displayName || "",
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalContentType>({
    title: "",
    text: "",
  });

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Compress image for faster uploads
    });

    // Robust check to prevent crash if user cancels or if assets are unexpectedly empty
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated for image upload.");

    // The modern way to fetch a blob in React Native
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `profile_images/${user.uid}`);
    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
  };

  const handleUpdateProfile = async () => {
    if (!displayName) {
      Alert.alert("Error", "Display name cannot be empty.");
      return;
    }
    setLoading(true);
    let photoURL = user?.photoURL;

    if (imageUri) {
      try {
        const uploadUrl = await uploadImageAsync(imageUri);
        photoURL = uploadUrl;
      } catch (e) {
        Alert.alert("Upload Error", "Failed to upload profile picture.");
        setLoading(false);
        return;
      }
    }

    try {
      await updateProfileInfo(displayName, photoURL || undefined);
      Alert.alert("Success", "Profile updated successfully.");
      setImageUri(null);
    } catch (error: any) {
      Alert.alert("Update Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(newPassword);
      Alert.alert("Success", "Password changed successfully.");
      setNewPassword("");
    } catch (error: any) {
      Alert.alert(
        "Password Error",
        "Could not change password. You may need to sign in again to perform this action.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!currentPassword) {
      Alert.alert(
        "Error",
        "Please enter your current password to delete your account.",
      );
      return;
    }
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure? This action is irreversible and will delete all your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccount(currentPassword);
              router.replace("/login");
            } catch (error: any) {
              Alert.alert("Deletion Error", error.message);
            } finally {
              setLoading(false);
              setCurrentPassword("");
            }
          },
        },
      ],
    );
  };

  const showModal = (type: "privacy" | "eula") => {
    if (type === "privacy") {
      setModalContent({
        title: "Privacy Policy",
        text: "Your privacy is important to us. It is Evergreen Focus's policy to respect your privacy regarding any information we may collect from you across our application.\n\nWe only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.\n\nWe only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.\n\nWe don’t share any personally identifying information publicly or with third-parties, except when required to by law.",
      });
    } else {
      setModalContent({
        title: "End-User License Agreement (EULA)",
        text: "This End-User License Agreement ('EULA') is a legal agreement between you and Evergreen Focus.\n\nThis EULA governs your acquisition and use of our Evergreen Focus software ('Software') directly from Evergreen Focus or indirectly through a Evergreen Focus authorized reseller or distributor (a 'Reseller').\n\nPlease read this EULA carefully before completing the installation process and using the Evergreen Focus software. It provides a license to use the Evergreen Focus software and contains warranty information and liability disclaimers.\n\nBy clicking 'accept' or installing and/or using the Evergreen Focus software, you are confirming your acceptance of the Software and agreeing to become bound by the terms of this EULA.",
      });
    }
    setModalVisible(true);
  };

  const handleReport = () => {
    const email = "Faranh31@gmail.com";
    const subject = "Report/Feedback for Evergreen Focus";
    const body = `Please describe the issue or your feedback here.\n\n-----------------\nApp Version: 1.0.0\nUser ID: ${
      user?.uid || "N/A"
    }\nPlatform: ${Platform.OS}`;
    const url = `mailto:${email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open email client.");
    });
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </ThemedView>
    );
  }

  const isAnonymous = user.isAnonymous;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={!isAnonymous ? handleImagePick : undefined}
        >
          <Image
            source={{
              uri:
                imageUri || user.photoURL || "https://via.placeholder.com/150",
            }}
            style={styles.avatar}
          />
          {!isAnonymous && (
            <View style={styles.cameraIcon}>
              <FontAwesome
                name="camera"
                size={16}
                color={themeColors.background}
              />
            </View>
          )}
        </TouchableOpacity>
        <ThemedText type="subtitle" style={{ textAlign: "center" }}>
          {user.displayName || "Anonymous User"}
        </ThemedText>
        <ThemedText
          style={{ textAlign: "center", opacity: 0.7, marginBottom: 24 }}
        >
          {isAnonymous ? "Anonymous Account" : user.email}
        </ThemedText>

        {isAnonymous ? (
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <ThemedText type="defaultSemiBold">Anonymous Account</ThemedText>
            <ThemedText style={{ marginTop: 8, opacity: 0.8, lineHeight: 22 }}>
              Sign up for an account to save your progress, customize your
              profile, and access all features.
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: themeColors.tint, marginTop: 16 },
              ]}
              onPress={() => {
                logout().then(() => router.replace("/signup"));
              }}
            >
              <Text style={styles.buttonText}>Sign Up Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ThemedText type="title" style={styles.sectionTitle}>
              Profile Settings
            </ThemedText>
            <View style={[styles.card, { backgroundColor: themeColors.card }]}>
              <ThemedText type="defaultSemiBold">Update Profile</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                  },
                ]}
                placeholder="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholderTextColor={themeColors.tabIconDefault}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: themeColors.tint }]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading && !newPassword && !currentPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Update Profile</Text>
                )}
              </TouchableOpacity>
            </View>

            <ThemedText type="title" style={styles.sectionTitle}>
              Security
            </ThemedText>
            <View style={[styles.card, { backgroundColor: themeColors.card }]}>
              <ThemedText type="defaultSemiBold">Change Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                  },
                ]}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholderTextColor={themeColors.tabIconDefault}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: themeColors.tint }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading && newPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <ThemedText type="title" style={styles.sectionTitle}>
          General
        </ThemedText>
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
            <ThemedText style={styles.settingText}>Toggle Theme</ThemedText>
            <MaterialCommunityIcons
              name={theme === "dark" ? "weather-night" : "weather-sunny"}
              size={24}
              color={themeColors.tint}
            />
          </TouchableOpacity>
        </View>

        <ThemedText type="title" style={styles.sectionTitle}>
          Support & Legal
        </ThemedText>
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => showModal("privacy")}
          >
            <ThemedText style={styles.settingText}>Privacy Policy</ThemedText>
            <FontAwesome
              name="chevron-right"
              size={16}
              color={themeColors.tabIconDefault}
            />
          </TouchableOpacity>
          <View
            style={[styles.divider, { backgroundColor: themeColors.border }]}
          />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => showModal("eula")}
          >
            <ThemedText style={styles.settingText}>EULA</ThemedText>
            <FontAwesome
              name="chevron-right"
              size={16}
              color={themeColors.tabIconDefault}
            />
          </TouchableOpacity>
          <View
            style={[styles.divider, { backgroundColor: themeColors.border }]}
          />
          <TouchableOpacity style={styles.settingRow} onPress={handleReport}>
            <ThemedText style={styles.settingText}>
              Report an Issue / Feedback
            </ThemedText>
            <FontAwesome
              name="chevron-right"
              size={16}
              color={themeColors.tabIconDefault}
            />
          </TouchableOpacity>
        </View>

        <ThemedText type="title" style={styles.sectionTitle}>
          Account Actions
        </ThemedText>
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: themeColors.accent, marginBottom: 12 },
            ]}
            onPress={logout}
          >
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
          {!isAnonymous && (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    marginTop: 8,
                  },
                ]}
                placeholder="Enter current password to delete"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholderTextColor={themeColors.tabIconDefault}
              />
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: themeColors.destructive },
                ]}
                onPress={handleDeleteAccount}
                disabled={loading}
              >
                {loading && currentPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
        backdropTransitionOutTiming={0}
      >
        <View
          style={[styles.modalContent, { backgroundColor: themeColors.card }]}
        >
          <ThemedText type="title" style={styles.modalTitle}>
            {modalContent.title}
          </ThemedText>
          <ScrollView style={styles.modalScrollView}>
            <ThemedText style={styles.modalText}>
              {modalContent.text}
            </ThemedText>
          </ScrollView>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={[
              styles.button,
              { backgroundColor: themeColors.tint, marginTop: 20 },
            ]}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 8,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#3A8E7E",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3A8E7E",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F4F7F6",
  },
  card: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 4,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    padding: 22,
    maxHeight: "70%",
  },
  modalTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: "80%",
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
