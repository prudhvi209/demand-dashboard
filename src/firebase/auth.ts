import { 
  signInWithPopup, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  getAuth,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { auth, googleProvider, app, db } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

const getUserProfile = async (u: FirebaseUser): Promise<UserProfile> => {
  const token = await u.getIdTokenResult();
  const claimRole = typeof token.claims.role === 'string' ? token.claims.role : undefined;
  const isAdmin = token.claims.admin === true || claimRole?.toLowerCase() === 'admin';
  let role = isAdmin ? 'admin' : claimRole;

  try {
    const profile = await getDoc(doc(db, 'users', u.uid));
    const storedRole = profile.data()?.role;
    if (!role && typeof storedRole === 'string') role = storedRole;
  } catch (error) {
    console.warn('Could not load user role from Firestore', error);
  }

  return {
    uid: u.uid,
    displayName: u.displayName || u.email?.split('@')[0] || 'Agivant User',
    email: u.email,
    photoURL: u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    role,
    isAdmin,
    isDemo: false
  };
};

export const signInWithGoogle = async (): Promise<UserProfile> => {
  const result = await signInWithPopup(auth, googleProvider);
  return getUserProfile(result.user);
};

export const signInWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
  const result = await firebaseSignInWithEmailAndPassword(auth, email, pass);
  return getUserProfile(result.user);
};

let userCreationAuth: Auth | null = null;

const getUserCreationAuth = (): Auth => {
  if (!userCreationAuth) {
    const secondaryApp = getApps().find((firebaseApp) => firebaseApp.name === 'user-creation')
      || initializeApp(app.options, 'user-creation');
    userCreationAuth = getAuth(secondaryApp);
  }
  return userCreationAuth;
};

export const createUserAccount = async (email: string, password: string): Promise<void> => {
  const creationAuth = getUserCreationAuth();
  try {
    const result = await createUserWithEmailAndPassword(creationAuth, email, password);
    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role: 'user',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('User account created, but profile document could not be saved', error);
    }
  } finally {
    await firebaseSignOut(creationAuth);
  }
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
      getUserProfile(user).then(callback).catch((error) => {
        console.error('Could not load authenticated user profile', error);
        callback(null);
      });
    } else {
      callback(null);
    }
  });
};
