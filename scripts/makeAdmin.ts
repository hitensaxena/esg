import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local file
const envPath = join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeUserAdmin(userId: string) {
  try {
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User document does not exist');
      return;
    }
    
    await setDoc(
      userRef,
      {
        isAdmin: true,
        role: 'admin',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    
    console.log('User has been granted admin access');
    
  } catch (error) {
    console.error('Error making user admin:', error);
  }
}

// Get user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID');
  process.exit(1);
}

makeUserAdmin(userId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
