import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  connectFirestoreEmulator, 
  initializeFirestore,
  persistentLocalCache,    
  CACHE_SIZE_UNLIMITED,
  FirestoreSettings        
} from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Define types for Firebase services
export type FirebaseServices = {
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  firebaseApp: FirebaseApp | null;
};

// Firebase configuration object from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log missing essential environment variables on the client
if (typeof window !== 'undefined') {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.warn(
      `Firebase SDK config is missing essential environment variables: ${missingVars.join(
        ', '
      )}. Features may not work as expected.`
    );
  }
}

// Internal variables for memoized services
let _memoizedFirebaseApp: FirebaseApp | null = null;
let _memoizedAuth: Auth | null = null;
let _memoizedDb: Firestore | null = null;
let _memoizedStorage: FirebaseStorage | null = null;

// Core Firebase initialization logic (previously initializeFirebase)
const _initializeFirebaseCore = (): FirebaseServices => {
  try {
    const app = getApps().length === 0 
      ? initializeApp(firebaseConfig) 
      : getApp();
    _memoizedFirebaseApp = app;

    _memoizedAuth = getAuth(app);
    
    const firestoreSettings: FirestoreSettings = { 
      localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }) 
    };
    _memoizedDb = initializeFirestore(app, firestoreSettings);
    
    _memoizedStorage = getStorage(app);
    
    // Emulator connections (only in development and if configured)
    const isDev = process.env.NODE_ENV === 'development';
    const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

    // @ts-ignore (for window.__EMULATORS_CONNECTED__)
    if (isDev && useEmulator && typeof window !== 'undefined' && !window.__EMULATORS_CONNECTED__) {
      try {
        if (_memoizedAuth) connectAuthEmulator(_memoizedAuth, 'http://localhost:9099', { disableWarnings: true });
        if (_memoizedDb) connectFirestoreEmulator(_memoizedDb, 'localhost', 8080);
        if (_memoizedStorage) connectStorageEmulator(_memoizedStorage, 'localhost', 9199);
        console.log('Connected to Firebase emulators');
        // @ts-ignore
        window.__EMULATORS_CONNECTED__ = true;
      } catch (err) {
        console.warn('Could not connect to Firebase emulators:', err);
      }
    }
     
    return { 
      auth: _memoizedAuth, 
      db: _memoizedDb, 
      storage: _memoizedStorage, 
      firebaseApp: _memoizedFirebaseApp 
    };
    
  } catch (error) {
    console.error('Firebase core initialization error:', error);
    return { auth: null, db: null, storage: null, firebaseApp: null };
  }
};

// Export a function to get Firebase services, ensuring client-side initialization
export const getFirebaseServices = (): FirebaseServices => {
  // If not in a browser environment, return null services
  if (typeof window === 'undefined') {
    // console.log('Firebase: Server-side environment detected - getFirebaseServices returning null services');
    return { auth: null, db: null, storage: null, firebaseApp: null };
  }
  
  // If services are already initialized, return the memoized instances
  if (_memoizedFirebaseApp) {
    return { 
      auth: _memoizedAuth, 
      db: _memoizedDb, 
      storage: _memoizedStorage, 
      firebaseApp: _memoizedFirebaseApp 
    };
  }
  
  // Otherwise, initialize and memoize
  return _initializeFirebaseCore();
};

// Export types
export type { FirebaseApp, Auth, Firestore, FirebaseStorage };