import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function checkAssessmentCompletion(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    return userDoc.exists() && userDoc.data().hasCompletedAssessment;
  } catch (error) {
    console.error('Error checking assessment completion:', error);
    return false;
  }
}