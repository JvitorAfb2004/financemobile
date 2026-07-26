import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import firebaseConfig from '../constants/firebaseConfig';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = initializeAuth(app, {
  // @ts-ignore - getReactNativePersistence is not typed in web bundle but exists on RN
  persistence: getReactNativePersistence(AsyncStorage),
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    await signInWithPopup(auth, googleProvider);
    return;
  }
  Alert.alert(
    'Google Login',
    'Disponível apenas na versão web. Use email/senha no app.',
  );
};

export const signInWithEmail = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (displayName: string, email: string, password: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
};

export const resetPassword = async (email: string) =>
  sendPasswordResetEmail(auth, email);

export const signOut = () => fbSignOut(auth);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
