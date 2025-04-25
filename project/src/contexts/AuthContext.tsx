import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile as firebaseUpdateProfile, // Renamed
  User as FirebaseUser,
  updateEmail
} from 'firebase/auth';
import { auth, db } from '../config/firebase'; // Import db
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'; // Import Firestore functions

// Define user type
export type User = {
  id: string;
  username: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  createdAt?: any; // Add timestamp if needed
};

// Auth state type
type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

// Auth context type
type AuthContextType = AuthState & {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true })); // Start loading on mount
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => { // Make async
      if (firebaseUser) {
        // Fetch additional data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const firestoreData = userDocSnap.exists() ? userDocSnap.data() : {};

        const user: User = {
          id: firebaseUser.uid,
          username: firestoreData.username || firebaseUser.displayName || '',
          email: firebaseUser.email || '', // Email usually comes from Auth
          name: firestoreData.name || firebaseUser.displayName || '',
          avatar: firestoreData.avatar || firebaseUser.photoURL || '', // Prioritize Firestore avatar
          bio: firestoreData.bio || '',
          createdAt: firestoreData.createdAt, // Get timestamp if stored
        };
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state after fetching Firestore data
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error; // Re-throw error to be caught in component
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      // Wait for the profile update to complete
      await firebaseUpdateProfile(firebaseUser, { displayName: username });

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const initialUserData = {
        uid: firebaseUser.uid,
        username: username,
        email: email,
        name: username, // Initially set name same as username
        bio: '', // Default empty bio
        avatar: '', // Default empty avatar
        createdAt: serverTimestamp(), // Add creation timestamp
      };
      await setDoc(userDocRef, initialUserData);

      // Manually update the local state immediately after profile update
      const newUser: User = {
        id: firebaseUser.uid,
        ...initialUserData, // Spread initial data
      };
      setState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      });

    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error; // Re-throw error to be caught in component
    }
    // No finally block needed here as state is set within try/catch
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null
    } catch (error) {
      console.error('Failed to logout:', error);
      // Optionally show a toast error
    }
  };

  const forgotPassword = async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await sendPasswordResetEmail(auth, email);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error; // Re-throw error to be caught in component
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      // Data to update in Firebase Auth
      const authUpdateData: { displayName?: string | null; photoURL?: string | null } = {};
      if (data.name !== undefined || data.username !== undefined) {
        authUpdateData.displayName = data.name || data.username || null;
      }
      // Only update photoURL if it's not a long data URL
      if (data.avatar !== undefined && !data.avatar.startsWith('data:')) {
        authUpdateData.photoURL = data.avatar || null;
      } else if (data.avatar === '') { // Allow clearing the photoURL
        authUpdateData.photoURL = null;
      }


      // Data to update in Firestore
      const firestoreUpdateData: Partial<User> = {};
      if (data.name !== undefined) firestoreUpdateData.name = data.name;
      if (data.username !== undefined) firestoreUpdateData.username = data.username; // Add username
      if (data.bio !== undefined) firestoreUpdateData.bio = data.bio;
      if (data.avatar !== undefined) firestoreUpdateData.avatar = data.avatar; // Always update Firestore avatar
      if (data.email !== undefined && data.email !== currentUser.email) {
        firestoreUpdateData.email = data.email; // Update email in Firestore too
      }

      // Perform updates concurrently
      const updatePromises = [];

      // Update Auth Email if changed
      if (data.email && data.email !== currentUser.email) {
        updatePromises.push(updateEmail(currentUser, data.email));
      }

      // Update Auth Profile if changed
      if (Object.keys(authUpdateData).length > 0) {
        updatePromises.push(firebaseUpdateProfile(currentUser, authUpdateData));
      }
      // Update Firestore Document if changed
      if (Object.keys(firestoreUpdateData).length > 0) {
        const userDocRef = doc(db, 'users', currentUser.uid); // Get doc reference
        updatePromises.push(updateDoc(userDocRef, firestoreUpdateData)); // Add update promise
      }

      await Promise.all(updatePromises);


      // Update local state reflecting the changes
      setState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      await updatePassword(user, newPassword);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error; // Re-throw error to be caught in component
    }
  };

  const value = {
    ...state,
    login,
    signup,
    logout,
    forgotPassword,
    updateProfile: updateUserProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};