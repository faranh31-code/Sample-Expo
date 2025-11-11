import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInAnonymously: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  updateProfileInfo: (displayName: string, photoURL?: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const randomAvatar = `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(uid)}`;
    await updateProfile(userCredential.user, { displayName, photoURL: randomAvatar });
    try {
      await setDoc(doc(db, 'users', uid), { displayName, photoURL: randomAvatar }, { merge: true });
    } catch {}
    return userCredential;
  };

  const reloadUser = async (): Promise<void> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      // If photoURL missing, try fetching from Firestore user doc
      try {
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (snap.exists()) {
          const data = snap.data() as { photoURL?: string; displayName?: string };
          if (!auth.currentUser.photoURL && data?.photoURL) {
            await updateProfile(auth.currentUser, { photoURL: data.photoURL });
          }
          if (!auth.currentUser.displayName && data?.displayName) {
            await updateProfile(auth.currentUser, { displayName: data.displayName });
          }
        }
      } catch {}
      setUser(auth.currentUser);
    }
  };

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signInAnonymouslyHandler = async (): Promise<UserCredential> => {
    return await signInAnonymously(auth);
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const updateProfileInfo = async (displayName: string, photoURL?: string): Promise<void> => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName, photoURL });
      // Ensure changes are reflected immediately in the app
      await auth.currentUser.reload();
      setUser(auth.currentUser);
      // Persist to Firestore for redundancy
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          displayName: auth.currentUser.displayName || displayName,
          photoURL: auth.currentUser.photoURL || photoURL || null,
        }, { merge: true });
      } catch {}
    }
  };

  const updatePasswordHandler = async (newPassword: string): Promise<void> => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const deleteAccount = async (password: string): Promise<void> => {
    if (auth.currentUser && auth.currentUser.email) {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await auth.currentUser.delete();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInAnonymously: signInAnonymouslyHandler,
    logout,
    updateProfileInfo,
    updatePassword: updatePasswordHandler,
    resetPassword,
    deleteAccount,
    reloadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
