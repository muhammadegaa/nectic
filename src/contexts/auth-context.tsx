"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser, updateProfile, UserCredential } from 'firebase/auth'
import {
  auth,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  onAuthStateChangedHelper
} from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getDoc, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Extend the Firebase User type
interface User extends FirebaseUser {
  company?: string
  role?: string
  industry?: string
  companySize?: string
  bio?: string
  systemsConnected?: {
    salesforce?: boolean
    microsoft365?: boolean
    quickbooks?: boolean
  }
  hasCompletedAssessment?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string, plan?: string) => Promise<void>
  signInWithGoogleProvider: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  bypassAuth: boolean
  enableBypass: () => void
  updateUserProfile: (data: Partial<User>) => Promise<void>
  hasCompletedAssessment: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bypassAuth, setBypassAuth] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the user's ID token result to check custom claims
          let tokenResult;
          try {
            tokenResult = await firebaseUser.getIdTokenResult();
          } catch (tokenError) {
            console.warn('Failed to get token result, using default role:', tokenError);
            // Create a mock token result with default role
            tokenResult = {
              claims: { role: 'user' },
              token: '',
              authTime: '',
              issuedAtTime: new Date().toISOString(),
              expirationTime: '',
              signInProvider: null,
              signInSecondFactor: null
            };
          }

          // Create a minimal user object with only essential data
          const userData = {
            ...firebaseUser,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            role: tokenResult.claims.role || 'user',
            hasCompletedAssessment: false
          } as User;

          setUser(userData);
          setLoading(false);

          // Check if user has completed assessment
          try {
            const hasCompleted = await checkAssessmentCompletion(firebaseUser.uid);

            if (!hasCompleted) {
              // Redirect to assessment page if not completed
              router.push('/dashboard/assessment');
            } else {
              // Update user with assessment completion status
              setUser(prev => prev ? {...prev, hasCompletedAssessment: true} : null);
            }
          } catch (assessmentError) {
            console.warn('Failed to check assessment completion:', assessmentError);
            // Continue without assessment check
          }
        } catch (error) {
          console.error('Error setting up user:', error);
          setError(error instanceof Error ? error.message : 'An error occurred during sign in');
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Function to check if user has completed assessment
  const checkAssessmentCompletion = async (userId: string): Promise<boolean> => {
    try {
      // This would typically check a database or storage for assessment completion
      // For now, we'll return false to ensure users go through the assessment flow
      return false;
    } catch (error) {
      console.error('Error checking assessment completion:', error);
      return false;
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
      throw err;
    }
  }

  const signUp = async (email: string, password: string, name?: string, plan?: string) => {
    try {
      setError(null);
      const userCredential = await signUpWithEmail(email, password);
      const firebaseUser = userCredential;

      // Update display name if provided
      if (name && firebaseUser) {
        try {
          await updateProfile(firebaseUser, { displayName: name });
        } catch (profileError) {
          console.warn('Failed to update display name:', profileError);
        }
      }

      // Create user document in Firestore
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          displayName: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || '',
          role: 'user',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          subscription: plan ? { tier: plan } : { tier: 'free' },
          systemsConnected: {
            salesforce: false,
            microsoft365: false,
            quickbooks: false
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign up');
      throw err;
    }
  }

  const signInWithGoogleProvider = async () => {
    try {
      // If in development and bypass is enabled, do nothing
      if (process.env.NODE_ENV === "development" && bypassAuth) {
        return;
      }

      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Create new user document if it doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          systemsConnected: {
            salesforce: false,
            microsoft365: false,
            quickbooks: false
          }
        });
      }

      // Get the token result for role
      const tokenResult = await user.getIdTokenResult();
      const role = tokenResult.claims.role || 'user';

      // Update user state with role from token
      setUser({
        ...user,
        role,
        company: userDoc.exists() ? userDoc.data().company : '',
        industry: userDoc.exists() ? userDoc.data().industry : '',
        companySize: userDoc.exists() ? userDoc.data().companySize : '',
        bio: userDoc.exists() ? userDoc.data().bio : '',
        systemsConnected: userDoc.exists() ? userDoc.data().systemsConnected : {
          salesforce: false,
          microsoft365: false,
          quickbooks: false
        }
      } as User);

      // Redirect to assessment page
      router.push('/dashboard/assessment');
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  }

  const logout = async () => {
    try {
      setError(null);
      if (bypassAuth) {
        setBypassAuth(false);
        setUser(null);
      } else {
        await signOutUser();
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
      throw err;
    }
  }

  const clearError = () => setError(null);

  const enableBypass = () => {
    if (process.env.NODE_ENV !== "development") {
      console.warn("Bypass mode is only available in development");
      return;
    }

    setBypassAuth(true);
    setUser({
      uid: 'bypass-user',
      email: 'bypass@example.com',
      displayName: 'Bypass User',
      photoURL: null,
      emailVerified: false,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      phoneNumber: null,
      providerId: 'bypass',
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({
        claims: { role: 'admin' },
        token: '',
        authTime: '',
        issuedAtTime: new Date().toISOString(),
        expirationTime: '',
        signInProvider: null,
        signInSecondFactor: null
      }),
      reload: async () => {},
      toJSON: () => ({}),
      company: 'Bypass Company',
      role: 'admin',
      industry: 'Technology',
      companySize: '1-10',
      bio: 'Bypass user for testing',
      hasCompletedAssessment: true,
      systemsConnected: {
        salesforce: false,
        microsoft365: false,
        quickbooks: false
      }
    } as User);
  }

  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      // Only update Firebase profile if not in bypass mode
      if (!bypassAuth) {
        try {
          // Update Firebase user profile
          await updateProfile(user, {
            displayName: data.displayName || user.displayName || '',
            photoURL: data.photoURL || user.photoURL || '',
          });
        } catch (profileError) {
          console.warn('Failed to update Firebase profile:', profileError);
          // Continue with the rest of the update
        }

        // Update custom claims if role is provided
        if (data.role) {
          try {
            // Check if getIdToken is available
            if (typeof user.getIdToken === 'function') {
              const token = await user.getIdToken();
              await fetch('/api/auth/update-role', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: data.role }),
              });
            } else {
              console.warn('getIdToken is not available, skipping role update');
            }
          } catch (error) {
            console.error('Error updating role:', error);
            // Continue with the rest of the profile update even if role update fails
          }
        }

        try {
          // Check if user document exists in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: data.role || user.role || 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...data
            });
          } else {
            // Update existing user document
            await updateDoc(userDocRef, {
              ...data,
              updatedAt: new Date().toISOString()
            });
          }

          // Fetch the updated user document to ensure we have the latest data
          const updatedDoc = await getDoc(userDocRef);
          if (updatedDoc.exists()) {
            const updatedData = updatedDoc.data();
            setUser(prev => prev ? {
              ...prev,
              ...updatedData,
              // Preserve Firebase user properties
              uid: prev.uid,
              email: prev.email,
              emailVerified: prev.emailVerified,
              isAnonymous: prev.isAnonymous,
              metadata: prev.metadata,
              providerData: prev.providerData,
              refreshToken: prev.refreshToken,
              tenantId: prev.tenantId,
              phoneNumber: prev.phoneNumber,
              providerId: prev.providerId,
              delete: prev.delete,
              getIdToken: prev.getIdToken,
              getIdTokenResult: prev.getIdTokenResult,
              reload: prev.reload,
              toJSON: prev.toJSON,
            } : null);
          }
        } catch (firestoreError) {
          console.warn('Failed to update Firestore document:', firestoreError);
          // Update local state even if Firestore update fails
          setUser(prev => prev ? { ...prev, ...data } : null);
        }
      } else {
        // For bypass users, just update the local state
        console.log('Updating bypass user profile:', data);
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Update local state even if there's an error
      setUser(prev => prev ? { ...prev, ...data } : null);
      throw error;
    }
  }

  const hasCompletedAssessment = (): boolean => {
    return user?.hasCompletedAssessment || false;
  }

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogleProvider,
    logout,
    clearError,
    bypassAuth,
    enableBypass,
    updateUserProfile,
    hasCompletedAssessment
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
