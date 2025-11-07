import { loadStripe } from '@stripe/stripe-js'

// Ensure the Stripe public key is available
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
if (!stripePublicKey) {
  throw new Error('Missing Stripe publishable key')
}

// Create a singleton instance of the Stripe promise
export const getStripe = () => {
  return loadStripe(stripePublicKey)
}

// Export the promise for components that need it
export const stripePromise = getStripe()