import type { Timestamp } from "firebase/firestore"

export type InvitationStatus = "pending" | "accepted" | "expired"
export type UserPlan = "free" | "standard" | "premium"

export interface Invitation {
  id: string
  email: string
  code: string
  plan: UserPlan
  status: InvitationStatus
  createdAt: Timestamp
  expiresAt: Timestamp
  createdBy: string
  usedBy?: string
  usedAt?: Timestamp
}

export interface InvitationFormData {
  email: string
  plan: UserPlan
  expiryDays: number
}
