import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// NOTE: Keep these values in sync with your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyBs3-ho7AwET09pKAlK42PriyBOUB5ZNlY",
  authDomain: "studio-4264885498-3df2e.firebaseapp.com",
  projectId: "studio-4264885498-3df2e",
  storageBucket: "studio-4264885498-3df2e.appspot.com",
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
  // Try react-native entry first
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnAuth = require("firebase/auth/react-native");
  const persistence = rnAuth?.getReactNativePersistence
    ? rnAuth.getReactNativePersistence(AsyncStorage)
    : undefined;
  if (persistence) {
    auth = initializeAuth(app, { persistence });
  } else {
    // Fallback to unified export (Firebase v11) if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const coreAuth = require("firebase/auth");
    const getReactNativePersistence = coreAuth?.getReactNativePersistence;
    if (typeof getReactNativePersistence === "function") {
      const p = getReactNativePersistence(AsyncStorage);
      auth = initializeAuth(app, { persistence: p });
    } else {
      auth = getAuth(app);
    }
  }
} catch {
  // Absolute fallback: no persistence
  auth = getAuth(app);
}

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
