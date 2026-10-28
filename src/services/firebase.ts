import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  onAuthStateChanged, 
  signOut as fbSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { User, Room, RoommateProfile } from '../types';

// The user's active Firebase Configuration
export const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyDV1ElvApvcIbROD5a5xxl3Q-BWZr_5-hM",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "roombridge-93411.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "roombridge-93411",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "roombridge-93411.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "369669771427",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:369669771427:web:dc73dbf2f50d4fd7066f16",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-89VDRPNYNX"
};

// Singleton App Initialization
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Sign in with Google using native Firebase Auth Popup
 */
export async function signInWithGoogleFirebase(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Retrieve existing or create new Firestore document in 'users' collection
  let existingData: Partial<User> = {};
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      existingData = snap.data() as User;
    }
  } catch (err) {
    console.warn('[Firestore] Could not fetch existing user doc, proceeding with fresh profile:', err);
  }

  const userData: User = {
    uid: fbUser.uid,
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
    email: fbUser.email || '',
    profileImageUrl: fbUser.photoURL || undefined,
    role: existingData.role || 'user',
    occupation: existingData.occupation || 'Software Engineer',
    college: existingData.college || 'BITS Pilani',
    city: existingData.city || 'Bengaluru',
    preferredLocality: existingData.preferredLocality || 'Indiranagar',
    age: existingData.age || 23,
    budgetMin: existingData.budgetMin || 12000,
    budgetMax: existingData.budgetMax || 20000,
    cleanliness: existingData.cleanliness || 'spotless',
    noiseTolerance: existingData.noiseTolerance || 'low',
    foodPreference: existingData.foodPreference || 'vegetarian',
    sleepTime: existingData.sleepTime || '23:30',
    wakeTime: existingData.wakeTime || '07:30',
    bio: existingData.bio || `${fbUser.displayName || 'User'} • Verified Google user via Firebase Auth.`,
    profileCompleted: true,
    ...existingData
  };

  // Persist user to Firestore 'users' collection
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    await setDoc(userDocRef, {
      ...userData,
      lastLoginAt: serverTimestamp(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('[Firestore] User document synchronized:', fbUser.uid);
  } catch (err) {
    console.warn('[Firestore] Sync warning (offline or rule check):', err);
  }

  return userData;
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfileToFirestore(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync user profile error:', err);
  }
}

/**
 * Save Questionnaire Preferences to Firestore 'preferences' collection
 */
export async function syncPreferencesToFirestore(userId: string, preferences: any): Promise<void> {
  try {
    const prefDocRef = doc(db, 'preferences', userId);
    await setDoc(prefDocRef, {
      userId,
      ...preferences,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync preferences error:', err);
  }
}

/**
 * Save Listed Room to Firestore 'rooms' collection
 */
export async function syncRoomToFirestore(room: Room): Promise<void> {
  try {
    const roomDocRef = doc(db, 'rooms', room.roomId);
    await setDoc(roomDocRef, {
      ...room,
      createdAt: room.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Sync room error:', err);
  }
}

/**
 * Listen for Firebase Auth state changes
 */
export function onFirebaseAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign out from Firebase
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('[Firebase] Sign out error:', err);
  }
}
