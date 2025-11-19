/**
 * Infrastructure: Firebase Assessment Repository
 * Implements IAssessmentRepository using Firestore
 */

import { IAssessmentRepository } from '@/domain/repositories/assessment.repository'
import { AssessmentResult, AssessmentQuestion } from '@/domain/entities/assessment.entity'
import { db, Timestamp } from '../firebase/firebase-client'
import { collection, doc, getDoc, setDoc, query, where, getDocs, addDoc } from 'firebase/firestore'

export class FirebaseAssessmentRepository implements IAssessmentRepository {
  private readonly resultsCollection = 'assessmentResults'
  private readonly questionsCollection = 'assessmentQuestions'

  async saveResult(result: Omit<AssessmentResult, 'id' | 'completedAt'>): Promise<AssessmentResult> {
    const resultRef = await addDoc(collection(db, this.resultsCollection), {
      ...result,
      answers: result.answers.map(a => ({
        ...a,
        answeredAt: Timestamp.fromDate(a.answeredAt),
      })),
      completedAt: Timestamp.now(),
    })

    const saved = await getDoc(resultRef)
    const data = saved.data()!

    return {
      id: saved.id,
      userId: data.userId,
      answers: data.answers.map((a: any) => ({
        ...a,
        answeredAt: a.answeredAt.toDate(),
      })),
      scores: data.scores,
      completedAt: data.completedAt.toDate(),
      primaryPainPoint: data.primaryPainPoint,
    }
  }

  async getResultByUserId(userId: string): Promise<AssessmentResult | null> {
    const q = query(
      collection(db, this.resultsCollection),
      where('userId', '==', userId)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }

    // Get the most recent result
    const docs = snapshot.docs.sort((a, b) => {
      const aTime = a.data().completedAt?.toDate() || new Date(0)
      const bTime = b.data().completedAt?.toDate() || new Date(0)
      return bTime.getTime() - aTime.getTime()
    })

    const data = docs[0].data()
    return {
      id: docs[0].id,
      userId: data.userId,
      answers: data.answers.map((a: any) => ({
        ...a,
        answeredAt: a.answeredAt.toDate(),
      })),
      scores: data.scores,
      completedAt: data.completedAt.toDate(),
      primaryPainPoint: data.primaryPainPoint,
    }
  }

  async getQuestions(): Promise<AssessmentQuestion[]> {
    // For now, return hardcoded questions
    // In production, you'd fetch from Firestore
    return [
      {
        id: 'primary-pain-point',
        text: 'What is your primary pain point?',
        type: 'multiple-choice',
        options: [
          'Document processing and paperwork',
          'Customer service and support',
          'Data processing and analysis',
          'Workflow and process automation',
        ],
        required: true,
        category: 'pain-point',
      },
      {
        id: 'company-size',
        text: 'What is your company size?',
        type: 'multiple-choice',
        options: ['1-10 employees', '10-50 employees', '50+ employees'],
        required: true,
        category: 'company-info',
      },
      {
        id: 'budget',
        text: 'What is your monthly budget for automation?',
        type: 'multiple-choice',
        options: ['Less than $1k', '$1k-$5k', '$5k-$10k', '$10k+'],
        required: true,
        category: 'budget',
      },
      {
        id: 'timeline',
        text: 'When do you want to implement automation?',
        type: 'multiple-choice',
        options: ['Immediately', 'Within 1 month', 'Within 3 months', 'Just exploring'],
        required: true,
        category: 'timeline',
      },
    ]
  }
}

