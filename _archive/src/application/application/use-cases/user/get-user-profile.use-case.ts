/**
 * Use Case: Get User Profile
 * Retrieves user profile with subscription status
 */

import { IUserRepository } from '@/domain/repositories/user.repository'
import { IPaymentRepository } from '@/domain/repositories/payment.repository'
import { UserProfile } from '@/domain/entities/user.entity'

export interface UserProfileWithSubscription extends UserProfile {
  hasActiveSubscription: boolean
}

export class GetUserProfileUseCase {
  constructor(
    private userRepository: IUserRepository,
    private paymentRepository: IPaymentRepository
  ) {}

  async execute(userId: string): Promise<UserProfileWithSubscription> {
    const user = await this.userRepository.findById(userId)
    
    if (!user) {
      throw new Error('User not found')
    }

    // Get subscription status
    const subscription = await this.paymentRepository.findSubscriptionByUserId(userId)
    const hasActiveSubscription = subscription?.status === 'active'

    return {
      ...user,
      hasActiveSubscription,
    }
  }
}















