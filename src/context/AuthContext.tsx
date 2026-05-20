import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  doc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  wasLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wasLoggedIn, setWasLoggedIn] = useState(false);

  useEffect(() => {
    // Ensure persistence is set to LOCAL
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    // 🌟 Create a reference variable to store the profile listener cleanly
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (profileUnsubscribe) {
        profileUnsubscribe(); // Clean up previous listener if it exists
        profileUnsubscribe = null;
      }

      if (currentUser) {
        setWasLoggedIn(true);

        // Real-time profile listener attached correctly
        profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ uid: currentUser.uid, ...docSnap.data() } as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile sync error details:", error);
          setLoading(false);
        });

      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe(); // Clean up profile listener on unmount
    };
  }, []); //Cleaned up unnecessary reactive array dependencies to prevent runaway re-renders

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, data);
  };

  const reauthenticate = async (password: string) => {
    if (!user || !user.email) throw new Error('No user logged in');
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, resetPassword, updateProfile, reauthenticate, wasLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
