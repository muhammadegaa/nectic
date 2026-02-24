/**
 * Password strength utilities
 */

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

export interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number // 0-4
  feedback: string[]
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { strength: 'weak', score: 0, feedback: [] }
  }

  let score = 0
  const feedback: string[] = []

  // Length checks
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }

  if (password.length >= 12) {
    score += 1
  }

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Mix uppercase and lowercase letters')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters (!@#$%...)')
  }

  // Determine strength
  let strength: PasswordStrength
  if (score <= 1) {
    strength = 'weak'
  } else if (score === 2) {
    strength = 'fair'
  } else if (score === 3) {
    strength = 'good'
  } else {
    strength = 'strong'
  }

  return { strength, score, feedback }
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500'
    case 'fair':
      return 'bg-orange-500'
    case 'good':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak'
    case 'fair':
      return 'Fair'
    case 'good':
      return 'Good'
    case 'strong':
      return 'Strong'
    default:
      return 'Unknown'
  }
}

