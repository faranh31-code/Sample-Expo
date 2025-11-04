import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from "react-native-firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// NOTE: Keep these values in sync with your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyBs3-ho7AwET09pKAlK42PriyBOUB5ZNlY",
  authDomain: "studio-4264885498-3df2e.firebaseapp.com",
  projectId: "studio-4264885498-3df2e",
  storageBucket: "studio-4264885498-3df2e.firebasestorage.app",
  messagingSenderId: "389611288011",
  appId: "1:389611288011:web:ea8556ae844e091847324e",
};

// Initialize Firebase (guard against re-initialization during fast refresh)
const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native.
// If Auth has already been initialized (e.g., by a previous fast refresh),
// fall back to getAuth(app) to avoid duplicate initialization errors.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
