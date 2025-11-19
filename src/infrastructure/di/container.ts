/**
 * Dependency Injection Container
 * Centralized dependency management following clean architecture
 */

import { IUserRepository } from '@/domain/repositories/user.repository'
import { IAssessmentRepository } from '@/domain/repositories/assessment.repository'
import { IOpportunityRepository } from '@/domain/repositories/opportunity.repository'
import { IPaymentRepository } from '@/domain/repositories/payment.repository'
import { IAIService } from '@/domain/services/ai-service.interface'
import { IPaymentService } from '@/domain/services/payment-service.interface'

import { FirebaseUserRepository } from '../repositories/firebase-user.repository'
import { FirebaseAssessmentRepository } from '../repositories/firebase-assessment.repository'
import { FirebaseOpportunityRepository } from '../repositories/firebase-opportunity.repository'
import { FirebasePaymentRepository } from '../repositories/firebase-payment.repository'
import { PerplexityAIService } from '../services/perplexity-ai.service'
// Temporarily disabled for MVP - causes build issues
// import { StripePaymentService } from '../services/stripe-payment.service'

// Repository instances
let userRepository: IUserRepository
let assessmentRepository: IAssessmentRepository
let opportunityRepository: IOpportunityRepository
let paymentRepository: IPaymentRepository

// Service instances
let aiService: IAIService
let paymentService: IPaymentService

// Initialize repositories (singleton pattern)
export function getUserRepository(): IUserRepository {
  if (!userRepository) {
    userRepository = new FirebaseUserRepository()
  }
  return userRepository
}

export function getAssessmentRepository(): IAssessmentRepository {
  if (!assessmentRepository) {
    assessmentRepository = new FirebaseAssessmentRepository()
  }
  return assessmentRepository
}

export function getOpportunityRepository(): IOpportunityRepository {
  if (!opportunityRepository) {
    opportunityRepository = new FirebaseOpportunityRepository()
  }
  return opportunityRepository
}

export function getPaymentRepository(): IPaymentRepository {
  if (!paymentRepository) {
    paymentRepository = new FirebasePaymentRepository()
  }
  return paymentRepository
}

// Initialize services (singleton pattern)
export function getAIService(): IAIService {
  if (!aiService) {
    aiService = new PerplexityAIService()
  }
  return aiService
}

export function getPaymentService(): IPaymentService {
  // Temporarily disabled for MVP - causes build issues
  // if (!paymentService) {
  //   paymentService = new StripePaymentService()
  // }
  // return paymentService
  throw new Error('Payment service not available in MVP')
}





