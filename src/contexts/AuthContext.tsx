'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, SetStateAction, Dispatch } from 'react';
import {
  Auth,
  User as FirebaseUser, // Rename to avoid conflict with our UserData
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendEmailVerification as firebaseSendEmailVerification,
  deleteUser as firebaseDeleteUserSdk, 
  AuthCredential,
  linkWithCredential as firebaseLinkWithCredential,
  reauthenticateWithCredential as firebaseReauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app'; 
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentData,
  FieldValue,
  Timestamp as FirestoreTimestamp, // For type consistency if needed
} from 'firebase/firestore';
import { getFirebaseServices } from '@/utils/firebaseConfig'; // Ensure db is correctly initialized and exported, ideally typed as Firestore
import toast from 'react-hot-toast';

// Define a more specific type for Firestore user data
export interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
  roles: string[]; // e.g., ['user', 'editor']
  metadata: { 
    creationTime?: string; 
    lastSignInTime?: string;
  };
  createdAt: FieldValue; 
  updatedAt: FieldValue;
  lastLoginAt?: FieldValue;
  [key: string]: any; 
}

// Define the shape of the user data we'll use in the app
// Combines essential FirebaseUser properties with our FirestoreUser structure
export interface UserData {
  // From FirestoreUser (primary source of truth for app-specific data)
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean; // Can be sourced from FirebaseUser and synced to Firestore
  isAdmin: boolean;
  roles: string[];
  firestoreCreatedAt: FieldValue; // Renamed to avoid clash if FirebaseUser had 'createdAt'
  firestoreUpdatedAt: FieldValue; // Renamed to avoid clash
  firestoreLastLoginAt?: FieldValue; // Renamed to avoid clash
  // Other custom fields from FirestoreUser
  [key: string]: any; 

  // Essential properties from FirebaseUser for auth context state
  firebaseUid: string; // Explicitly storing Firebase's UID
  isAnonymous: boolean;
  firebaseMetadata: { // Keeping Firebase metadata separate if needed
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerId?: string; // From FirebaseUser's providerData if simple, or process providerData separately
  refreshToken?: string; // If needed by the app, though typically handled by SDK
}

// Define the shape of the AuthContext
export interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: UserData | null; 
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, additionalData?: Record<string, any>) => Promise<UserCredential>; 
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string | null }) => Promise<void>; 
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  loginWithProvider: (providerName: LoginProviderName) => Promise<UserCredential>;
  linkAccountWithCredential: (credential: AuthCredential) => Promise<UserCredential>;
  reauthenticateUser: (credential: AuthCredential) => Promise<UserCredential>;
  sendVerificationEmail: () => Promise<void>;
  checkAdminStatus: (userId: string) => Promise<boolean>;
  deleteUserAccount: () => Promise<void>;
  fetchUserData: (userId: string) => Promise<FirestoreUser | null>; 
  getFriendlyErrorMessage: (error: any) => string;
}

export type LoginProviderName = 'google' | 'facebook' | 'twitter' | 'github' | 'microsoft' | 'apple' | 'yahoo';

// Helper function to get a friendly error message
const getFriendlyErrorMessage = (error: any): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in or use a different email.';
      case 'auth/weak-password':
        return 'The password is too weak. Please choose a stronger password.';
      case 'auth/requires-recent-login':
        return 'This operation is sensitive and requires recent authentication. Please sign out and sign in again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      // Add more specific Firebase error codes as needed
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
  return error.message || 'An unexpected error occurred. Please try again.';
};

// Function to format user data by combining Firebase Auth data and Firestore data
const formatUserData = (user: FirebaseUser, firestoreData: FirestoreUser | DocumentData | null): UserData => {
  // Base structure from FirebaseUser
  const baseData = {
    firebaseUid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    firebaseMetadata: {
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
    },
    providerId: user.providerData?.[0]?.providerId, // Simplified, consider full providerData if needed
    refreshToken: user.refreshToken, 
  };

  // Merge with Firestore data, Firestore data takes precedence for shared fields
  // This assumes firestoreData is an object if not null
  const mergedData: UserData = {
    ...baseData,
    uid: firestoreData?.uid || user.uid, // Prefer Firestore uid, fallback to auth uid
    isAdmin: firestoreData?.isAdmin || false,
    roles: firestoreData?.roles || ['user'],
    // Ensure correct timestamp handling if firestoreData comes directly from Firestore
    firestoreCreatedAt: firestoreData?.createdAt || serverTimestamp(), 
    firestoreUpdatedAt: firestoreData?.updatedAt || serverTimestamp(),
    firestoreLastLoginAt: firestoreData?.lastLoginAt, // Can be undefined
    // Spread other fields from firestoreData
    ...(firestoreData || {}),
  };

  return mergedData;
};

// Create auth context
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Get Firebase services
  // This will be null on the server and initialized on the client
  const { auth, db } = getFirebaseServices();

  // Fetch additional user data from Firestore
  const fetchUserData = useCallback(async (userId: string): Promise<FirestoreUser | null> => {
    if (!db) {
      console.warn('Firestore (db) is not initialized. Cannot fetch user data.');
      setError('Firestore is not available. User data may be incomplete.');
      return null;
    }
    const currentDb = db; // db is confirmed non-null
    try {
      const userDocRef = doc(currentDb, 'users', userId);
      const userDocSnap = await getDoc(userDocRef); // userDocSnap is DocumentSnapshot
      if (userDocSnap.exists()) { // Check if document exists
        return userDocSnap.data() as FirestoreUser; // data() is safe if exists() is true
      }
      return null;
    } catch (e) {
      console.error("Error fetching user data from Firestore:", e);
      setError(getFriendlyErrorMessage(e));
      return null;
    }
  }, [db]); // db dependency


  // Effect for auth state changes
  useEffect(() => {
    setMounted(true);

    if (!auth) {
      console.warn("Firebase Auth is not available. Auth features will be disabled.");
      setIsLoading(false);
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      return; 
    }
    const currentAuthInstance = auth; 

    const unsubscribe = onAuthStateChanged(currentAuthInstance, async (user) => {
      setIsLoading(true);
      if (user) {
        if (!db) { 
          console.warn("Firestore is not available. User data from Firestore will be incomplete.");
          const formattedUser = formatUserData(user, null); 
          setCurrentUser(user);
          setUserData(formattedUser);
          setIsAdmin(formattedUser.isAdmin || false);
        } else {
          const currentDb = db; 
          try {
            const userDocRef = doc(currentDb, 'users', user.uid); 
            const userDocSnap = await getDoc(userDocRef); // This is DocumentSnapshot
            // The lint error for userDocSnap being possibly null is incorrect here.
            // getDoc returns a DocumentSnapshot; its .exists() method is then checked.
            const firestoreData = userDocSnap.exists() ? userDocSnap.data() : null; 
            const formattedUser = formatUserData(user, firestoreData);
            setCurrentUser(user);
            setUserData(formattedUser);
            setIsAdmin(formattedUser.isAdmin || false);

            try {
              await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
            } catch (e) {
              console.error("Failed to update lastLoginAt on auth state change:", e);
            }
          } catch (error) {
            console.error("Error fetching user data during auth state change:", error);
            const formattedUser = formatUserData(user, null);
            setCurrentUser(user);
            setUserData(formattedUser);
            setIsAdmin(formattedUser.isAdmin || false); 
          }
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      setMounted(false);
    };
  }, [auth, db, fetchUserData]); // formatUserData was removed as it's defined in the outer scope and doesn't change
                                // setIsLoading, setCurrentUser, setUserData, setIsAdmin are setters from useState, stable.

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) {
      setIsLoading(false);
      setError('Firebase Auth is not initialized.');
      throw new Error('Firebase Auth is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    const currentAuth = auth; 

    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(currentAuth, email, password);
      const user = userCredential.user;

      if (user) {
        if (!db) { 
          console.warn("Firestore is not available after sign-in. User data may be incomplete and lastLoginAt not updated.");
          const formattedUser = formatUserData(user, null); 
          setCurrentUser(user);
          setUserData(formattedUser);
          setIsAdmin(formattedUser.isAdmin || false);
        } else {
          const currentDb = db; 
          const userDocRef = doc(currentDb, 'users', user.uid); 
          try {
            await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
          } catch (e) {
            console.error("Failed to update lastLoginAt on sign-in:", e);
          }
          const firestoreData = await fetchUserData(user.uid); 
          const formattedUser = formatUserData(user, firestoreData);
          setCurrentUser(user);
          setUserData(formattedUser);
          setIsAdmin(formattedUser.isAdmin || false);
        }
      }
      toast.success('Signed in successfully!');
      return userCredential;
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, additionalData?: Record<string, any>): Promise<UserCredential> => {
    if (!auth) {
      setIsLoading(false);
      setError('Firebase Auth is not initialized.');
      throw new Error('Firebase Auth is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    if (!db) { 
      setIsLoading(false);
      setError('Firestore is not initialized.');
      throw new Error('Firestore is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    const currentAuth = auth; 
    const currentDb = db;   

    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(currentAuth, email, password);
      const user = userCredential.user;
      const creationTime = user.metadata.creationTime || new Date().toISOString();
      const lastSignInTime = user.metadata.lastSignInTime || new Date().toISOString();

      const userDataToStore: FirestoreUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData?.displayName || null,
        photoURL: user.photoURL || additionalData?.photoURL || null,
        emailVerified: user.emailVerified,
        isAdmin: additionalData?.isAdmin || false,
        roles: additionalData?.roles || ['user'],
        metadata: {
          creationTime,
          lastSignInTime,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(), // Also set lastLoginAt on creation
        ...additionalData,
      };

      const userDocRef = doc(currentDb, 'users', user.uid); 
      await setDoc(userDocRef, userDataToStore);

      const formattedUser = formatUserData(user, userDataToStore);
      setCurrentUser(user);
      setUserData(formattedUser);
      setIsAdmin(formattedUser.isAdmin || false);
      toast.success('Signed up successfully! Please check your email to verify your account.');
      await sendVerificationEmail();
      return userCredential;
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOutUser = async (): Promise<void> => {
    if (!auth) {
      setIsLoading(false);
      console.warn('Firebase Auth is not initialized. Cannot sign out.');
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      return;
    }
    const currentAuth = auth; 

    setIsLoading(true);
    setError(null);
    try {
      await firebaseSignOut(currentAuth);
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Send password reset email
  const resetPassword = async (email: string): Promise<void> => {
    if (!auth) {
      setIsLoading(false);
      setError('Firebase Auth is not initialized.');
      throw new Error('Firebase Auth is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    const currentAuth = auth; 

    setIsLoading(true);
    setError(null);
    try {
      await firebaseSendPasswordResetEmail(currentAuth, email);
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile (displayName, photoURL)
  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string | null }): Promise<void> => {
    if (!auth || !auth.currentUser) {
      setIsLoading(false);
      setError('User not authenticated or Firebase Auth not initialized.');
      throw new Error('User not authenticated or Firebase Auth not initialized.');
    }
    if (!db) {
      setIsLoading(false);
      setError('Firestore is not initialized.');
      throw new Error('Firestore is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    const currentAuthUser = auth.currentUser; 
    const currentDb = db; 

    setIsLoading(true);
    setError(null);
    try {
      // Update Firebase Auth profile first
      await firebaseUpdateProfile(currentAuthUser, {
        displayName: updates.displayName !== undefined ? updates.displayName : currentAuthUser.displayName,
        photoURL: updates.photoURL !== undefined ? updates.photoURL : currentAuthUser.photoURL,
      });

      // Then update Firestore
      const firestoreUpdates: Partial<FirestoreUser> = { updatedAt: serverTimestamp() };
      if (updates.displayName !== undefined) firestoreUpdates.displayName = updates.displayName;
      // For photoURL, if it's explicitly set to null, we should store null.
      // If undefined, it means no change, so we don't include it in firestoreUpdates unless it's part of firebaseUpdateProfile.
      if (updates.photoURL !== undefined) firestoreUpdates.photoURL = updates.photoURL;

      if (Object.keys(firestoreUpdates).length > 1 || updates.photoURL === null) { 
        const userDocRef = doc(currentDb, 'users', currentAuthUser.uid);
        await updateDoc(userDocRef, firestoreUpdates);
      }

      // Refetch or reformat user data
      const refreshedFirebaseUser = auth.currentUser; // Get the latest FirebaseUser object
      if (!refreshedFirebaseUser) throw new Error('User disappeared after profile update')
      const firestoreData = await fetchUserData(refreshedFirebaseUser.uid);
      const formattedUser = formatUserData(refreshedFirebaseUser, firestoreData);
      
      setCurrentUser(refreshedFirebaseUser);
      setUserData(formattedUser);
      setIsAdmin(formattedUser.isAdmin || false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }; 

  // Update user email
  const updateUserEmail = async (newEmail: string): Promise<void> => {
    if (!auth || !auth.currentUser) {
      setIsLoading(false);
      setError('User not authenticated or Firebase Auth not initialized.');
      throw new Error('User not authenticated or Firebase Auth not initialized.');
    }
    if (!db) {
      setIsLoading(false);
      setError('Firestore is not initialized.');
      throw new Error('Firestore is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    const currentAuthUser = auth.currentUser;
    const currentDb = db;

    setIsLoading(true);
    setError(null);
    try {
      await firebaseUpdateEmail(currentAuthUser, newEmail);
      const userDocRef = doc(currentDb, 'users', currentAuthUser.uid);
      await updateDoc(userDocRef, { email: newEmail, emailVerified: false, updatedAt: serverTimestamp() });

      const refreshedFirebaseUser = auth.currentUser; 
      if (!refreshedFirebaseUser) throw new Error('User disappeared after email update');
      const firestoreData = await fetchUserData(refreshedFirebaseUser.uid);
      const formattedUser = formatUserData(refreshedFirebaseUser, firestoreData); 
      
      setCurrentUser(refreshedFirebaseUser);
      setUserData(formattedUser);
      setIsAdmin(formattedUser.isAdmin || false);
      toast.success('Email updated successfully! Please check your new email for verification.');
      await sendVerificationEmail();
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user password
  const updateUserPassword = async (newPassword: string): Promise<void> => {
    if (!auth || !auth.currentUser) {
      setIsLoading(false);
      setError('User not authenticated or Firebase Auth not initialized.');
      throw new Error('User not authenticated or Firebase Auth not initialized.');
    }
    const currentAuthUser = auth.currentUser;
    setIsLoading(true);
    setError(null);
    try {
      await firebaseUpdatePassword(currentAuthUser, newPassword);
      toast.success('Password updated successfully!');
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login with OAuth provider
  const loginWithProvider = async (providerName: LoginProviderName): Promise<UserCredential> => {
    if (!auth) {
      setIsLoading(false);
      setError('Firebase Auth is not initialized.');
      throw new Error('Firebase Auth is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    if (!db) {
      setIsLoading(false);
      setError('Firestore is not initialized.');
      throw new Error('Firestore is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    const currentAuth = auth;
    const currentDb = db;

    let authProvider: FirebaseAuthProviderType;
    switch (providerName) {
      case 'google': authProvider = new GoogleAuthProvider(); break;
      case 'facebook': authProvider = new FacebookAuthProvider(); break;
      case 'twitter': authProvider = new TwitterAuthProvider(); break;
      case 'github': authProvider = new GithubAuthProvider(); break;
      // Add other providers like Microsoft, Apple using OAuthProvider if needed
      // case 'microsoft': authProvider = new OAuthProvider('microsoft.com'); break;
      // case 'apple': authProvider = new OAuthProvider('apple.com'); break;
      default: 
        toast.error(`Provider ${providerName} is not supported.`);
        throw new Error(`Unsupported provider: ${providerName}`);
    }

    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithPopup(currentAuth, authProvider);
      const user = userCredential.user;
      const userDocRef = doc(currentDb, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let firestoreDataForFormatting: FirestoreUser | null = null;

      if (!userDocSnap.exists()) {
        const creationTime = user.metadata.creationTime || new Date().toISOString();
        const lastSignInTime = user.metadata.lastSignInTime || new Date().toISOString();
        const newUserFirestoreData: FirestoreUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          isAdmin: false, 
          roles: ['user'],
          metadata: { creationTime, lastSignInTime },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserFirestoreData);
        firestoreDataForFormatting = newUserFirestoreData;
      } else {
        await updateDoc(userDocRef, { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() });
        firestoreDataForFormatting = userDocSnap.data() as FirestoreUser;
      }
      
      const formattedUser = formatUserData(user, firestoreDataForFormatting);
      setCurrentUser(user);
      setUserData(formattedUser);
      setIsAdmin(formattedUser.isAdmin || false);
      toast.success(`Signed in with ${providerName} successfully!`);
      return userCredential;
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Link account with credential
  const linkAccountWithCredential = async (credential: AuthCredential): Promise<UserCredential> => {
    if (!auth || !auth.currentUser) {
      setIsLoading(false);
      setError('User not authenticated or Firebase Auth not initialized.');
      throw new Error('User not authenticated or Firebase Auth not initialized.');
    }
    if (!db && auth.currentUser) { 
        console.warn("Firestore not available. Linked account's full data might not be immediately available.")
    }
    const currentAuthUser = auth.currentUser;
    
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await firebaseLinkWithCredential(currentAuthUser, credential);
      const user = userCredential.user;
      
      const firestoreData = db ? await fetchUserData(user.uid) : null;
      const formattedUser = formatUserData(user, firestoreData);
      setCurrentUser(user);
      setUserData(formattedUser);
      setIsAdmin(formattedUser.isAdmin || false);
      toast.success('Account linked successfully!');
      return userCredential;
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Re-authenticate user
  const reauthenticateUser = async (credential: AuthCredential): Promise<UserCredential> => {
    if (!auth || !auth.currentUser) {
      setIsLoading(false);
      setError('User not authenticated or Firebase Auth not initialized.');
      throw new Error('User not authenticated or Firebase Auth not initialized.');
    }
    const currentAuthUser = auth.currentUser;
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await firebaseReauthenticateWithCredential(currentAuthUser, credential);
      toast.success('Re-authenticated successfully!');
      return userCredential;
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Send email verification
  const sendVerificationEmail = async (): Promise<void> => {
    if (!auth || !auth.currentUser) {
      setIsLoading(false);
      setError('User not authenticated or Firebase Auth not initialized.');
      console.warn('User not authenticated or Firebase Auth not initialized. Cannot send verification email.');
      return; 
    }
    const currentAuthUser = auth.currentUser;
    setIsLoading(true);
    setError(null);
    try {
      await firebaseSendEmailVerification(currentAuthUser);
      toast.success('Verification email sent. Please check your inbox.');
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the current user is an admin
  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    if (!db) {
      console.warn('Firestore is not initialized. Cannot check admin status.');
      return false;
    }
    const currentDb = db;
    try {
      const userDocRef = doc(currentDb, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return data?.isAdmin || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError(getFriendlyErrorMessage(error));
      return false;
    }
  };

  // Delete user account
  const deleteUserAccount = async (): Promise<void> => {
    if (!auth || !auth.currentUser) {
      setIsLoading(false);
      setError('User not authenticated or Firebase Auth not initialized.');
      throw new Error('User not authenticated or Firebase Auth not initialized.');
    }
    if (!db) {
      setIsLoading(false);
      setError('Firestore is not initialized.');
      throw new Error('Firestore is not initialized. Please ensure you are in a browser environment and Firebase is configured correctly.');
    }
    const currentAuthUser = auth.currentUser;
    const currentDb = db;

    setIsLoading(true);
    setError(null);
    try {
      const userDocRef = doc(currentDb, 'users', currentAuthUser.uid);
      await deleteDoc(userDocRef); // Delete Firestore document first
      await firebaseDeleteUserSdk(currentAuthUser); // Then delete Firebase auth user

      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      toast.success('Account deleted successfully.');
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      if ((error as FirebaseError).code === 'auth/requires-recent-login') {
        toast.error('This operation is sensitive and requires recent authentication. Please sign in again and retry.');
      } else {
        toast.error(friendlyMessage);
      }
      setError(friendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentUser,
    userData,
    isLoading,
    isAdmin,
    error,
    signIn,
    signUp,
    signOut: signOutUser,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    loginWithProvider,
    linkAccountWithCredential,
    reauthenticateUser,
    sendVerificationEmail,
    checkAdminStatus,
    deleteUserAccount,
    fetchUserData,
    getFriendlyErrorMessage
  }), [
    currentUser, userData, isLoading, isAdmin, error, auth, db, fetchUserData,
    // Explicitly list functions that depend on auth or db if they are not using useCallback with auth/db in their deps
    // For now, assuming internal functions like signIn, signUp, etc., correctly use the auth/db from the outer scope
    // or are stable. fetchUserData is already memoized with useCallback and includes db.
    // The main useEffect also depends on auth and db.
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {mounted ? children : null} 
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Type for Firebase Auth Provider (used in loginWithProvider)
type FirebaseAuthProviderType = 
  | GoogleAuthProvider 
  | FacebookAuthProvider 
  | TwitterAuthProvider 
  | GithubAuthProvider 
  | OAuthProvider;