import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAr9UoAh-aka4lZDcF0GI8HXXjTRXUTDk0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demand-2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demand-2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demand-2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "852684779659",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:852684779659:web:633a0b51250b823d0a248e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KMFM1LXT09"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Initialize Firebase Analytics if supported
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.log("Firebase Analytics initialization skipped:", err);
  });
}

export const isFirebaseConfigured = true;
