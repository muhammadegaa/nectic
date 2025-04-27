"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"

// Load Stripe outside of component render to avoid recreating Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  plan: z.enum(["standard", "premium"], {
    required_error: "Please select a plan.",
  }),
})

function PaymentFormContent() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cardError, setCardError] = useState("")
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      companyName: "",
      plan: "premium",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return
    }

    setIsSubmitting(true)
    setCardError("")

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error("Card element not found")
      }

      // Create payment method
      const { error: createPaymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: values.fullName,
          email: values.email,
        },
      })

      if (createPaymentMethodError) {
        setCardError(createPaymentMethodError.message || "An error occurred with your card")
        setIsSubmitting(false)
        return
      }

      // Send to server to create subscription
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          email: values.email,
          name: values.fullName,
          companyName: values.companyName,
          plan: values.plan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment")
      }

      // Handle subscription
      if (data.requiresAction) {
        // Card requires authentication
        const { error: confirmationError } = await stripe.confirmCardPayment(data.clientSecret)

        if (confirmationError) {
          throw new Error(confirmationError.message || "Failed to confirm payment")
        }
      }

      // Success
      toast({
        title: "Payment successful!",
        description: "We'll notify you before Nectic launches. Your card will be charged according to your plan.",
      })

      // Redirect to success page
      router.push(`/success?plan=${values.plan}`)
    } catch (error) {
      console.error("Payment error:", error)
      setCardError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select Plan</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="standard" />
                    </FormControl>
                    <FormLabel className="font-normal">Standard Plan ($249/month)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="premium" />
                    </FormControl>
                    <FormLabel className="font-normal">Premium Plan ($499/month)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Card Information Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Card Information</h3>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
          {cardError && <p className="text-sm text-red-500">{cardError}</p>}
          <div className="mt-1">
            <p className="text-xs text-gray-500">
              Your card will be charged immediately. You can cancel your subscription anytime.
            </p>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || !stripe}>
          {isSubmitting ? "Processing..." : "Subscribe Now"}
        </Button>
      </form>
    </Form>
  )
}

export default function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent />
    </Elements>
  )
}
