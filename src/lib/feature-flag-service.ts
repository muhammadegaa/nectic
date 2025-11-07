import { db, Timestamp, serverTimestamp } from "./firebase"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { User } from 'firebase/auth'
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagTarget } from "./feature-flag-types"

const COLLECTION_NAME = 'featureFlags'

interface CustomClaims {
  role?: string;
  [key: string]: any;
}

interface FeatureFlagData extends Omit<FeatureFlag, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper function to convert string to number for percentage rollouts
const hashStringToNumber = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Initialize default feature flags
const defaultFlags: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'beta_features',
    description: 'Enable beta features for testing',
    status: 'disabled',
    target: 'global',
    createdBy: 'system'
  },
  {
    name: 'advanced_analytics',
    description: 'Enable advanced analytics features',
    status: 'disabled',
    target: 'role',
    targetValue: ['admin', 'analyst'],
    createdBy: 'system'
  }
];

export const featureFlagService = {
  // Initialize default flags
  initializeDefaultFlags: async () => {
    const flagsRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(flagsRef);

    if (snapshot.empty) {
      for (const flag of defaultFlags) {
        const docRef = doc(flagsRef);
        await setDoc(docRef, {
          ...flag,
          id: docRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    }
  },

  // Get all feature flags
  getFlags: async (): Promise<FeatureFlag[]> => {
    const flagsRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(flagsRef);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as FeatureFlag[];
  },

  // Get a single feature flag
  getFlag: async (id: string): Promise<FeatureFlag | null> => {
    const flagRef = doc(db, COLLECTION_NAME, id);
    const flagDoc = await getDoc(flagRef);
    if (!flagDoc.exists()) return null;
    return { ...flagDoc.data(), id: flagDoc.id } as FeatureFlag;
  },

  // Create a new feature flag
  createFlag: async (data: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> => {
    const flagsRef = collection(db, COLLECTION_NAME);
    const docRef = doc(flagsRef);
    const newFlag: FeatureFlagData = {
      ...data,
      id: docRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await setDoc(docRef, newFlag);
    return {
      ...newFlag,
      createdAt: newFlag.createdAt.toDate(),
      updatedAt: newFlag.updatedAt.toDate()
    } as FeatureFlag;
  },

  // Update a feature flag
  updateFlag: async (id: string, data: Partial<FeatureFlag>): Promise<void> => {
    const flagRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(flagRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  },

  // Delete a feature flag
  deleteFlag: async (id: string): Promise<void> => {
    const flagRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(flagRef);
  },

  // Evaluate if a feature is enabled for a specific user
  evaluateFlag: async (flag: FeatureFlag, user: User | null): Promise<boolean> => {
    if (!user) return false;
    if (flag.status === 'disabled') return false;
    if (flag.status === 'enabled' && flag.target === 'global') return true;

    // Check user role
    if (flag.target === 'role' && flag.targetValue && Array.isArray(flag.targetValue)) {
      try {
        let userRole: string | undefined;

        // Try to get role from token result if available
        if (typeof user.getIdTokenResult === 'function') {
          const tokenResult = await user.getIdTokenResult();
          userRole = tokenResult.claims.role as string | undefined;
        }

        // Fallback to checking user role from metadata if available
        if (!userRole) {
          userRole = (user as any).role as string | undefined;
        }

        // Check if user role matches any of the target roles
        if (userRole && flag.targetValue.includes(userRole)) {
          return true;
        }
      } catch (error) {
        console.error('Error getting token result:', error);
      }
    }

    // Check percentage rollout
    if (flag.status === 'percentage' && flag.percentage !== undefined && user.uid) {
      const randomValue = hashStringToNumber(user.uid) % 100;
      return randomValue < flag.percentage;
    }

    return false;
  },

  // Get all enabled features for a user
  getUserEnabledFeatures: async (user: User | null): Promise<Record<string, boolean>> => {
    const flags = await featureFlagService.getFlags();
    const enabledFeatures: Record<string, boolean> = {};

    for (const flag of flags) {
      enabledFeatures[flag.id] = await featureFlagService.evaluateFlag(flag, user);
    }

    return enabledFeatures;
  }
};
