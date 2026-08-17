import { 
  signInWithPopup, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { UserProfile } from '../types';

export const signInWithGoogle = async (): Promise<UserProfile> => {
  const result = await signInWithPopup(auth, googleProvider);
  const u = result.user;
  return {
    uid: u.uid,
    displayName: u.displayName || u.email?.split('@')[0] || 'Agivant User',
    email: u.email,
    photoURL: u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    role: 'Demand Analyst',
    isDemo: false
  };
};

export const signInWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
  const result = await firebaseSignInWithEmailAndPassword(auth, email, pass);
  const u = result.user;
  return {
    uid: u.uid,
    displayName: u.displayName || u.email?.split('@')[0] || 'Agivant User',
    email: u.email,
    photoURL: u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    role: 'Demand Analyst',
    isDemo: false
  };
};

export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error("Sign out error", err);
  }
};

export const subscribeToAuthChanges = (callback: (user: UserProfile | null) => void) => {
  return onAuthStateChanged(auth, (user: FirebaseUser | null) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Agivant User',
        email: user.email,
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        role: 'Demand Analyst',
        isDemo: false
      });
    } else {
      callback(null);
    }
  });
};
