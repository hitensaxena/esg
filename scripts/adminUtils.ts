import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local file
const envPath = join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

// Initialize Firebase Admin
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

export async function makeUserAdmin(userId: string): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error('❌ User document does not exist');
      return;
    }

    await userRef.update({
      isAdmin: true,
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ User has been granted admin access');
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    throw error;
  }
}

// Check if this is the main module
const isMain = import.meta.url === `file://${process.argv[1]}`;

// Run if this file is executed directly
if (isMain) {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('❌ Please provide a user ID');
    process.exit(1);
  }

  makeUserAdmin(userId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
