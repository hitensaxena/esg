import { Firestore, doc, DocumentReference, DocumentData, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

/**
 * Type guard to check if Firestore is properly initialized
 */
function isFirestoreInitialized(firestore: Firestore | null): firestore is Firestore {
  return !!firestore && typeof firestore === 'object' && 'app' in firestore;
}

/**
 * Safely creates a document reference
 */
export function createDocRef<T = DocumentData>(
  firestore: Firestore | null,
  collectionPath: string,
  docId: string
): DocumentReference<T> | null {
  if (!isFirestoreInitialized(firestore)) {
    console.warn('Firestore not initialized');
    return null;
  }
  
  try {
    return doc(firestore, collectionPath, docId) as DocumentReference<T>;
  } catch (error) {
    console.error('Error creating document reference:', error);
    return null;
  }
}

/**
 * Safely checks if Firestore is available and can be used
 */
export function isFirestoreAvailable(firestore: Firestore | null): firestore is Firestore {
  return isFirestoreInitialized(firestore);
}

/**
 * Safely gets a document from Firestore
 */
export async function safeGetDoc<T = DocumentData>(
  firestore: Firestore | null,
  collectionPath: string,
  docId: string
): Promise<{ data: T | null; error: Error | null }> {
  if (!isFirestoreAvailable(firestore)) {
    return { data: null, error: new Error('Firestore not available') };
  }

  try {
    const docRef = doc(firestore, collectionPath, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: docSnap.data() as T, error: null };
    }
    return { data: null, error: new Error('Document not found') };
  } catch (error) {
    console.error('Error getting document:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error getting document') 
    };
  }
}

/**
 * Safely sets a document in Firestore
 */
export async function safeSetDoc<T = DocumentData>(
  firestore: Firestore | null,
  collectionPath: string,
  docId: string,
  data: T
): Promise<{ success: boolean; error: Error | null }> {
  if (!isFirestoreAvailable(firestore)) {
    return { success: false, error: new Error('Firestore not available') };
  }

  try {
    const docRef = doc(firestore, collectionPath, docId);
    await setDoc(docRef, data as any);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error setting document:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error setting document') 
    };
  }
}

/**
 * Safely updates a document in Firestore
 */
export async function safeUpdateDoc<T = DocumentData>(
  firestore: Firestore | null,
  collectionPath: string,
  docId: string,
  data: Partial<T>
): Promise<{ success: boolean; error: Error | null }> {
  if (!isFirestoreAvailable(firestore)) {
    return { success: false, error: new Error('Firestore not available') };
  }

  try {
    const docRef = doc(firestore, collectionPath, docId);
    await updateDoc(docRef, data as any);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating document:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error updating document') 
    };
  }
}

/**
 * Gets a friendly error message from a Firebase error
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const firebaseError = error as FirebaseError;
    
    // Handle Firebase Auth errors
    if (firebaseError.code) {
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          return 'This email is already in use by another account.';
        case 'auth/invalid-email':
          return 'The email address is not valid.';
        case 'auth/operation-not-allowed':
          return 'Email/password accounts are not enabled.';
        case 'auth/weak-password':
          return 'The password is too weak.';
        case 'auth/user-disabled':
          return 'This user account has been disabled.';
        case 'auth/user-not-found':
          return 'No user found with this email.';
        case 'auth/wrong-password':
          return 'Incorrect password.';
        case 'auth/too-many-requests':
          return 'Too many failed login attempts. Please try again later.';
        case 'auth/network-request-failed':
          return 'A network error occurred. Please check your connection.';
        default:
          return `An error occurred: ${firebaseError.message}`;
      }
    }
    
    return error.message || 'An unknown error occurred';
  }
  
  return String(error) || 'An unknown error occurred';
}
