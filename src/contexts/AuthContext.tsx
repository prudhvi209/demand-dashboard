import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { signInWithGoogle, signInWithEmail, signOutUser, subscribeToAuthChanges } from '../firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const loggedUser = await signInWithGoogle();
      setUser(loggedUser);
    } catch (err: any) {
      console.error("Google login failed", err);
      throw err;
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const loggedUser = await signInWithEmail(email, pass);
      setUser(loggedUser);
      return { success: true };
    } catch (err: any) {
      console.error("Email login failed", err);
      let message = 'Invalid email or password. Please check your credentials and try again.';
      const code = err?.code || '';
      
      if (
        code === 'auth/invalid-credential' || 
        code === 'auth/user-not-found' || 
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-login-credentials'
      ) {
        message = 'Invalid email or password. Please try again.';
      } else if (code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (code === 'auth/user-disabled') {
        message = 'This user account has been disabled. Please contact an administrator.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again in a few moments.';
      } else if (code === 'auth/network-request-failed') {
        message = 'Network connection issue. Please verify your internet connection.';
      } else if (err?.message) {
        message = err.message.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/.*\)\.?$/, '');
      }
      
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOutUser();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmailPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
