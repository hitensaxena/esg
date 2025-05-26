import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuTNEGGY2wu3RjEXVW5lQnuu40uEq3Ybg",
  authDomain: "esg-management.firebaseapp.com",
  projectId: "esg-management",
  storageBucket: "esg-management.firebasestorage.app",
  messagingSenderId: "37006283751",
  appId: "1:370062837519:web:d7b3198997b1c05069207a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };