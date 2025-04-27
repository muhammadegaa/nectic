"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  featureType: "implementation" | "roi" | "vendors" | "download"
}

export function SubscriptionModal({ isOpen, onClose, featureType }: SubscriptionModalProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const getFeatureTitle = () => {
    switch (featureType) {
      case "implementation":
        return "Implementation Guide"
      case "roi":
        return "ROI Calculator"
      case "vendors":
        return "Vendor Comparison"
      case "download":
        return "Download Report"
      default:
        return "Premium Feature"
    }
  }

  const getFeatureDescription = () => {
    switch (featureType) {
      case "implementation":
        return "Get step-by-step guidance for implementing this AI solution in your business."
      case "roi":
        return "Calculate the exact financial impact this AI solution will have on your business."
      case "vendors":
        return "Compare different vendors to find the perfect solution for your specific needs."
      case "download":
        return "Download a detailed report of this AI opportunity for sharing with your team."
      default:
        return "Unlock premium features to get the most out of Nectic."
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call to Stripe or payment processor
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)

      // Reset after showing success message
      setTimeout(() => {
        onClose()
        setIsSubmitted(false)
      }, 2000)
    }, 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" />
                Unlock {getFeatureTitle()}
              </DialogTitle>
              <DialogDescription>{getFeatureDescription()}</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="rounded-lg border p-4 mb-4">
                <h3 className="font-medium text-lg mb-2">Nectic Premium</h3>
                <p className="text-sm text-gray-600 mb-3">Get unlimited access to all premium features:</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Detailed implementation guides</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>ROI calculators and financial analysis</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Vendor comparisons and recommendations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Downloadable reports and resources</span>
                  </li>
                </ul>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold">$399</span>
                    <span className="text-sm text-gray-600">/month</span>
                  </div>
                  <span className="text-sm text-green-600">Current pricing</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Processing..." : "Subscribe Now"}
                    </Button>
                  </DialogFooter>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Thank You!</h3>
            <p className="text-gray-600">
              Your subscription has been processed. You now have access to all premium features.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
