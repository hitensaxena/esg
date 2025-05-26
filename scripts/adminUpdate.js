// adminUpdate.js - Script to update user role to admin
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local file
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin with service account
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function makeUserAdmin(userId) {
  try {
    console.log('🚀 Attempting to make user admin:', userId);
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error('❌ User document does not exist');
      return false;
    }

    console.log('📝 Updating user document...');
    await userRef.update({
      isAdmin: true,
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ User has been granted admin access');
    return true;
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    throw error;
  }
}

// Get user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID');
  process.exit(1);
}

// Run the function
console.log('🚀 Starting admin grant process...');
makeUserAdmin(userId)
  .then((success) => {
    if (success) {
      console.log('✅ Script completed successfully');
    } else {
      console.log('⚠️  Script completed with warnings');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
