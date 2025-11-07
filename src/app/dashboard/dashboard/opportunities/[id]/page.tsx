"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  HelpCircle,
  Users,
  Share2,
  Download,
  Lock,
  ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMediaQuery } from "@/hooks/use-media-query"
import { FeatureGate } from "@/components/feature-gate"
import { SubscriptionModal } from "@/components/subscription-modal"
import { getOpportunityById } from "@/lib/opportunities-service"
import { trackEvent } from "@/lib/analytics"
import { reportError } from "@/lib/error-reporting"
import { useAuth } from "@/contexts/auth-context"

// Import mobile-optimized components
import { MobileNavigation } from "@/components/mobile-navigation"
import { ResponsiveContainer } from "@/components/responsive-container"
import { ResponsiveCard } from "@/components/responsive-card"
import { MobileTabs } from "@/components/mobile-tabs"
import { MobileAccordion, MobileAccordionItem } from "@/components/mobile-accordion"
import { FloatingActionButton } from "@/components/floating-action-button"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { ShareButton } from "@/components/share-button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function OpportunityDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const subscription = (user as any)?.subscription
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [animateScore, setAnimateScore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [subscriptionModal, setSubscriptionModal] = useState<{
    isOpen: boolean;
    featureType: "vendors" | "download" | "roi" | "implementation" | "";
  }>({
    isOpen: false,
    featureType: "implementation",
  })

  // Media queries for responsive design
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)")

  // Trigger animation when component mounts
  useEffect(() => {
    setAnimateScore(true)
  }, [])

  useEffect(() => {
    async function loadOpportunity() {
      const opportunityId = Array.isArray(id) ? id[0] : id

      try {
        setLoading(true)

        // Fetch the opportunity data
        const data = await getOpportunityById(opportunityId, user?.uid || "anonymous")

        if (!data) {
          setError("Opportunity not found")
          return
        }

        // Transform the data to match the expected format for the UI
        const transformedOpportunity = {
          ...data,
          title: data.name,
          monthlySavings: data.monthlySavings,
          timeSaved: `${data.timeSavedHours} hours/month`,
          implementationTime: `${data.implementationTimeWeeks} weeks`,
          department: data.department,
          complexity: data.complexity,
          implementationSteps: [
            {
              id: 1,
              title: "Requirements Analysis",
              duration: "1-2 weeks",
              description: "Analyze business requirements and current processes to identify integration points.",
            },
            {
              id: 2,
              title: "Solution Design",
              duration: "1-2 weeks",
              description: "Design the implementation approach and select appropriate tools and technologies.",
            },
            {
              id: 3,
              title: "Development & Integration",
              duration: "2-3 weeks",
              description: "Develop the solution and integrate with existing systems.",
            },
            {
              id: 4,
              title: "Testing & Validation",
              duration: "1 week",
              description: "Test the solution thoroughly to ensure it meets requirements and performs as expected.",
            },
          ],
          roiAnalysis: {
            costs: {
              setup: data.monthlySavings * 3,
              license: data.monthlySavings * 0.2,
              implementation: data.monthlySavings * 2,
            },
            savings: {
              monthly: data.monthlySavings,
              annual: data.monthlySavings * 12,
              threeYear: data.monthlySavings * 36,
            },
            paybackPeriod: Math.ceil((data.monthlySavings * 5) / data.monthlySavings),
          },
          vendors: [
            {
              id: 1,
              name: "AI Solution Pro",
              type: "Enterprise Solution",
              cost: Math.round(data.monthlySavings * 0.25),
              recommended: true,
              features: [
                "Enterprise-grade security",
                "Dedicated support team",
                "Custom integration options",
                "Advanced analytics dashboard",
                "Regular updates and improvements",
              ],
            },
            {
              id: 2,
              name: "SmartAI",
              type: "Mid-tier Solution",
              cost: Math.round(data.monthlySavings * 0.15),
              recommended: false,
              features: [
                "Standard security features",
                "Email and chat support",
                "Basic integration capabilities",
                "Standard reporting",
                "Quarterly updates",
              ],
            },
            {
              id: 3,
              name: "BasicAI",
              type: "Starter Solution",
              cost: Math.round(data.monthlySavings * 0.08),
              recommended: false,
              features: [
                "Basic security",
                "Community support",
                "Limited integration options",
                "Basic reporting",
                "Infrequent updates",
              ],
            },
          ],
        }

        setOpportunity(transformedOpportunity)
        trackEvent("opportunity_viewed", {
          opportunityId,
          userId: user?.uid || "anonymous",
          source: "dashboard",
        })
      } catch (err) {
        console.error("Failed to load opportunity:", err)
        reportError(err, { context: "load-opportunity", opportunityId, userId: user?.uid || "anonymous" })
        setError("Failed to load opportunity details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadOpportunity()
  }, [id, user])

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Get the opportunity ID as string
      const opportunityId = Array.isArray(id) ? id[0] : id

      // Fetch the opportunity data again
      const data = await getOpportunityById(opportunityId, user?.uid || "anonymous")

      if (!data) {
        setError("Opportunity not found")
        return
      }

      // Transform and update the opportunity data
      // (Same transformation logic as above)
      setOpportunity(data)
      trackEvent("opportunity_viewed", {
        opportunityId: Array.isArray(id) ? id[0] : id,
        userId: user?.uid || "anonymous",
        source: "dashboard-refresh",
      })
      setError(null)
    } catch (err) {
      console.error("Failed to refresh opportunity:", err)
      reportError(err, { context: "refresh-opportunity", opportunityId: Array.isArray(id) ? id[0] : id, userId: user?.uid || "anonymous" })
      setError("Failed to refresh opportunity details. Please try again.")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Open subscription modal
  const openSubscriptionModal = (featureType: "vendors" | "download" | "roi" | "implementation") => {
    setSubscriptionModal({
      isOpen: true,
      featureType,
    })
  }

  // Close subscription modal
  const closeSubscriptionModal = () => {
    setSubscriptionModal({
      ...subscriptionModal,
      isOpen: false,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-red-500 mb-4">{error || "Opportunity not found"}</p>
        <Button
          onClick={() => router.push("/dashboard/opportunities")}
          className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Opportunities
        </Button>
      </div>
    )
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Function to determine difficulty text and color
  const getDifficultyBadge = () => {
    if (opportunity.complexity <= 2) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Easy</Badge>
    } else if (opportunity.complexity <= 4) {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Medium</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Complex</Badge>
    }
  }

  // Get complexity description
  const getComplexityDescription = () => {
    if (opportunity.complexity <= 2) {
      return "Simple implementation requiring minimal IT resources"
    } else if (opportunity.complexity <= 4) {
      return "Moderate complexity requiring some IT support"
    } else {
      return "Complex implementation requiring significant IT resources"
    }
  }

  // Define tabs for mobile and desktop
  const tabs = [
    { id: "overview", label: "Overview", icon: null },
    {
      id: "implementation",
      label: "Implementation",
      icon: subscription?.tier !== "premium" ? <Lock className="h-3 w-3 ml-1" /> : null,
    },
    {
      id: "roi",
      label: "ROI",
      icon: subscription?.tier !== "premium" ? <Lock className="h-3 w-3 ml-1" /> : null,
    },
    {
      id: "vendors",
      label: "Vendors",
      icon: subscription?.tier !== "premium" ? <Lock className="h-3 w-3 ml-1" /> : null,
    },
  ]

  // Define floating action buttons
  const floatingActions = [
    {
      icon: <Share2 className="h-4 w-4" />,
      label: "Share",
      onClick: () => {
        if (navigator.share) {
          navigator.share({
            title: `Nectic - ${opportunity.title}`,
            text: `Check out this AI opportunity: ${opportunity.title}`,
            url: window.location.href,
          })
        }
      },
    },
    {
      icon: <Download className="h-4 w-4" />,
      label: "Download",
      onClick: () => openSubscriptionModal("download"),
    },
  ]

  // Premium feature fallback component
  const PremiumFeatureFallback = ({ featureType }: { featureType: "vendors" | "download" | "roi" | "implementation" }) => (
    <div className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
          <Lock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
          <p className="text-gray-600 mb-4">This feature is available exclusively to Nectic Premium subscribers.</p>
          <Button onClick={() => openSubscriptionModal(featureType)}>Subscribe to Access</Button>
        </div>
      </div>

      {/* Blurred background content */}
      <div className="filter blur-sm pointer-events-none">
        <ResponsiveCard
          title={
            featureType === "implementation"
              ? "Implementation Plan"
              : featureType === "roi"
                ? "ROI Calculator"
                : "Vendor Comparison"
          }
          description={
            featureType === "implementation"
              ? "Step-by-step guide to implement this AI solution"
              : featureType === "roi"
                ? "Calculate the financial impact of this AI solution"
                : "Compare features across vendors to find the best fit"
          }
        >
          <div className="h-64 bg-gray-100"></div>
        </ResponsiveCard>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile navigation */}
      {isMobile && <MobileNavigation />}

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex-1 bg-gray-50">
          <ResponsiveContainer maxWidth="full" padding={isMobile ? "sm" : "md"} className="space-y-4 py-4">
            {/* Back button and badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/opportunities")}
                className="group transition-all duration-200 hover:border-amber-500 hover:bg-amber-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back
              </Button>

              {!isMobile && (
                <>
                  {opportunity.recommended && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      Recommended
                    </Badge>
                  )}
                  {opportunity.quickWin && (
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      Quick Win
                    </Badge>
                  )}
                  {getDifficultyBadge()}
                </>
              )}

              {!isMobile && (
                <div className="ml-auto">
                  <ShareButton
                    title={`Nectic - ${opportunity.title}`}
                    text={`Check out this AI opportunity: ${opportunity.title}`}
                  />
                </div>
              )}
            </div>

            {/* Opportunity header */}
            <ResponsiveCard title={opportunity.title} description={opportunity.description} className="mb-4">
              <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Monthly Savings</span>
                  <div className="flex items-center mt-1">
                    <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-lg font-bold">{formatCurrency(opportunity.monthlySavings)}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Time Saved</span>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-lg font-bold">{opportunity.timeSaved}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Timeline</span>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-lg font-bold">{opportunity.implementationTime}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <div className="flex items-center mt-1">
                    <Users className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-lg font-bold capitalize">{opportunity.department.replace("-", " ")}</span>
                  </div>
                </div>
              </div>

              {/* Mobile-only badges */}
              {isMobile && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {opportunity.recommended && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      Recommended
                    </Badge>
                  )}
                  {opportunity.quickWin && (
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      Quick Win
                    </Badge>
                  )}
                  {getDifficultyBadge()}
                </div>
              )}
            </ResponsiveCard>

            {/* Tabs - different components for mobile and desktop */}
            {isMobile ? (
              <MobileTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(tabId: string) => {
                  if (tabId !== "overview" && subscription?.tier !== "premium") {
                    if (tabId === "vendors" || tabId === "download" || tabId === "roi" || tabId === "implementation") {
                      openSubscriptionModal(tabId)
                    }
                  } else {
                    setActiveTab(tabId)
                  }
                }}
              />
            ) : (
              <div className="bg-white rounded-md border p-1">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id !== "overview" && subscription?.tier !== "premium") {
                          if (tab.id === "vendors" || tab.id === "download" || tab.id === "roi" || tab.id === "implementation") {
                            openSubscriptionModal(tab.id)
                          }
                        } else {
                          setActiveTab(tab.id)
                        }
                      }}
                      className={`
                      flex-1 px-4 py-2 text-sm font-medium rounded-sm transition-colors flex items-center justify-center gap-1
                      ${activeTab === tab.id ? "bg-amber-50 text-amber-900" : "text-gray-600 hover:text-amber-600"}
                    `}
                    >
                      {tab.label}
                      {tab.icon && tab.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <>
                    <ResponsiveCard
                      title="Opportunity Overview"
                      description="Key information about this AI opportunity"
                      collapsible={isMobile}
                    >
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Business Impact</h3>
                          <p className="mb-2">
                            This opportunity has a <strong>{opportunity.impactScore}%</strong> impact score, indicating
                            its potential to significantly improve business operations.
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${opportunity.impactScore}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="bg-amber-600 h-2 rounded-full"
                              ></motion.div>
                            </div>
                            <span className="text-sm font-medium">{opportunity.impactScore}%</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2 flex items-center">
                            Implementation Complexity
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Complexity is rated from 1 (simplest) to 5 (most complex)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </h3>

                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ scale: 0.5, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ delay: i * 0.1, duration: 0.3 }}
                                      className={`w-6 h-6 rounded-full mx-1 flex items-center justify-center ${
                                        i < opportunity.complexity
                                          ? "bg-amber-500 text-white"
                                          : "bg-gray-200 text-gray-400"
                                      }`}
                                    >
                                      {i + 1}
                                    </motion.div>
                                  ))}
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-gray-500 px-1">
                                  <span>Simple</span>
                                  <span>Complex</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{getComplexityDescription()}</p>
                          </div>
                        </div>
                      </div>
                    </ResponsiveCard>

                    {/* Use accordion on mobile, expandable sections on desktop */}
                    {isMobile ? (
                      <MobileAccordion>
                        <MobileAccordionItem title="Benefits" defaultOpen={true}>
                          <ul className="space-y-4">
                            {opportunity.benefits &&
                              opportunity.benefits.map((benefit: string, index: number) => (
                                <motion.li
                                  key={index}
                                  className="flex items-start gap-2"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span>{benefit}</span>
                                  </div>
                                </motion.li>
                              ))}
                          </ul>
                        </MobileAccordionItem>

                        <MobileAccordionItem title="Requirements">
                          <ul className="space-y-2">
                            {opportunity.requirements &&
                              opportunity.requirements.map((requirement: string, index: number) => (
                                <motion.li
                                  key={index}
                                  className="flex items-start gap-2"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <FileText className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                  <span>{requirement}</span>
                                </motion.li>
                              ))}
                          </ul>
                        </MobileAccordionItem>
                      </MobileAccordion>
                    ) : (
                      <div className="space-y-4">
                        <ResponsiveCard title="Benefits" collapsible={true} defaultCollapsed={false}>
                          <ul className="space-y-4">
                            {opportunity.benefits &&
                              opportunity.benefits.map((benefit: string, index: number) => (
                                <motion.li
                                  key={index}
                                  className="flex items-start gap-2"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span>{benefit}</span>
                                  </div>
                                </motion.li>
                              ))}
                          </ul>
                        </ResponsiveCard>

                        <ResponsiveCard title="Requirements" collapsible={true} defaultCollapsed={true}>
                          <ul className="space-y-2">
                            {opportunity.requirements &&
                              opportunity.requirements.map((requirement: string, index: number) => (
                                <motion.li
                                  key={index}
                                  className="flex items-start gap-2"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <FileText className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                  <span>{requirement}</span>
                                </motion.li>
                              ))}
                          </ul>
                        </ResponsiveCard>
                      </div>
                    )}

                    {/* Premium Features Teaser */}
                    {subscription?.tier !== "premium" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="bg-white rounded-lg border p-4 mt-6"
                      >
                        <h3 className="font-medium text-lg mb-3">Unlock Premium Features</h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gray-50 p-3 rounded-md border flex flex-col items-center text-center"
                          >
                            <div className="bg-amber-100 rounded-full p-2 mb-2">
                              <FileText className="h-5 w-5 text-amber-600" />
                            </div>
                            <h4 className="font-medium mb-1">Implementation Guide</h4>
                            <p className="text-sm text-gray-600 mb-3">
                              Step-by-step guidance for successful implementation
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-auto"
                              onClick={() => openSubscriptionModal("implementation")}
                            >
                              <Lock className="h-3 w-3 mr-1" /> Unlock
                            </Button>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gray-50 p-3 rounded-md border flex flex-col items-center text-center"
                          >
                            <div className="bg-amber-100 rounded-full p-2 mb-2">
                              <DollarSign className="h-5 w-5 text-amber-600" />
                            </div>
                            <h4 className="font-medium mb-1">ROI Calculator</h4>
                            <p className="text-sm text-gray-600 mb-3">
                              Calculate the exact financial impact for your business
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-auto"
                              onClick={() => openSubscriptionModal("roi")}
                            >
                              <Lock className="h-3 w-3 mr-1" /> Unlock
                            </Button>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gray-50 p-3 rounded-md border flex flex-col items-center text-center"
                          >
                            <div className="bg-amber-100 rounded-full p-2 mb-2">
                              <ExternalLink className="h-5 w-5 text-amber-600" />
                            </div>
                            <h4 className="font-medium mb-1">Vendor Comparison</h4>
                            <p className="text-sm text-gray-600 mb-3">
                              Find the perfect solution for your specific needs
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-auto"
                              onClick={() => openSubscriptionModal("vendors")}
                            >
                              <Lock className="h-3 w-3 mr-1" /> Unlock
                            </Button>
                          </motion.div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <Button className="w-full" onClick={() => openSubscriptionModal("implementation")}>
                            Subscribe to Nectic Premium
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Implementation Tab */}
                {activeTab === "implementation" && (
                  <FeatureGate
                    feature="implementation"
                    fallback={<PremiumFeatureFallback featureType="implementation" />}
                  >
                    <ResponsiveCard
                      title="Implementation Plan"
                      description="Step-by-step guide to implement this AI solution"
                      collapsible={isMobile}
                    >
                      <div className="space-y-6">
                        {opportunity.implementationSteps &&
                          opportunity.implementationSteps.map((step: any) => (
                            <motion.div
                              key={step.id}
                              className="border-l-4 border-amber-500 pl-4"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: step.id * 0.2 }}
                            >
                              <h3 className="font-medium text-lg mb-1">
                                Step {step.id}: {step.title} ({step.duration})
                              </h3>
                              <p className="text-gray-600">{step.description}</p>
                            </motion.div>
                          ))}
                      </div>
                    </ResponsiveCard>
                  </FeatureGate>
                )}

                {/* ROI Tab */}
                {activeTab === "roi" && (
                  <FeatureGate feature="roi" fallback={<PremiumFeatureFallback featureType="roi" />}>
                    <ResponsiveCard
                      title="ROI Analysis"
                      description="Financial impact of implementing this AI solution"
                    >
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium text-lg mb-3">Implementation Costs</h3>
                          <div className="grid gap-4 md:grid-cols-3">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="bg-gray-50 p-4 rounded-md"
                            >
                              <h4 className="text-sm text-gray-500 mb-1">Setup Cost</h4>
                              <p className="text-xl font-bold">{formatCurrency(opportunity.roiAnalysis.costs.setup)}</p>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="bg-gray-50 p-4 rounded-md"
                            >
                              <h4 className="text-sm text-gray-500 mb-1">Annual License</h4>
                              <p className="text-xl font-bold">
                                {formatCurrency(opportunity.roiAnalysis.costs.license * 12)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(opportunity.roiAnalysis.costs.license)}/month
                              </p>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="bg-gray-50 p-4 rounded-md"
                            >
                              <h4 className="text-sm text-gray-500 mb-1">Implementation</h4>
                              <p className="text-xl font-bold">
                                {formatCurrency(opportunity.roiAnalysis.costs.implementation)}
                              </p>
                            </motion.div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium text-lg mb-3">Projected Savings</h3>
                          <div className="grid gap-4 md:grid-cols-3">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="bg-green-50 p-4 rounded-md"
                            >
                              <h4 className="text-sm text-gray-500 mb-1">Monthly Savings</h4>
                              <p className="text-xl font-bold text-green-700">
                                {formatCurrency(opportunity.roiAnalysis.savings.monthly)}
                              </p>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="bg-green-50 p-4 rounded-md"
                            >
                              <h4 className="text-sm text-gray-500 mb-1">Annual Savings</h4>
                              <p className="text-xl font-bold text-green-700">
                                {formatCurrency(opportunity.roiAnalysis.savings.annual)}
                              </p>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                              className="bg-green-50 p-4 rounded-md"
                            >
                              <h4 className="text-sm text-gray-500 mb-1">3-Year Savings</h4>
                              <p className="text-xl font-bold text-green-700">
                                {formatCurrency(opportunity.roiAnalysis.savings.threeYear)}
                              </p>
                            </motion.div>
                          </div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 }}
                          className="bg-amber-50 p-4 rounded-md"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-lg">Payback Period</h3>
                              <p className="text-gray-600">Time to recoup your investment</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-amber-700">
                                {opportunity.roiAnalysis.paybackPeriod} months
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </ResponsiveCard>
                  </FeatureGate>
                )}

                {/* Vendors Tab */}
                {activeTab === "vendors" && (
                  <FeatureGate feature="vendors" fallback={<PremiumFeatureFallback featureType="vendors" />}>
                    <ResponsiveCard
                      title="Vendor Comparison"
                      description="Compare features across vendors to find the best fit"
                    >
                      <div className="space-y-6">
                        {opportunity.vendors &&
                          opportunity.vendors.map((vendor: any, index: number) => (
                            <motion.div
                              key={vendor.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.2 }}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="font-medium text-lg">{vendor.name}</h3>
                                  <p className="text-sm text-gray-500">{vendor.type}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">{formatCurrency(vendor.cost)}/month</p>
                                  {vendor.recommended && (
                                    <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                                  )}
                                </div>
                              </div>

                              <h4 className="font-medium mb-2">Key Features</h4>
                              <ul className="grid gap-2 md:grid-cols-2">
                                {vendor.features &&
                                    vendor.features.map((feature: string, idx: number) => (
                                    <motion.li
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 + idx * 0.05 }}
                                      className="flex items-start gap-2"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                      <span className="text-sm">{feature}</span>
                                    </motion.li>
                                  ))}
                              </ul>
                            </motion.div>
                          ))}
                      </div>
                    </ResponsiveCard>
                  </FeatureGate>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer actions */}
            {!isMobile && (
              <div className="flex justify-end gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (subscription?.tier !== "premium") {
                      openSubscriptionModal("download")
                    } else {
                      // Handle download for premium users
                      alert("Downloading report...")
                    }
                  }}
                  className="transition-all hover:bg-amber-50 hover:border-amber-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button
                  onClick={() => {
                    if (subscription?.tier !== "premium") {
                      openSubscriptionModal("implementation")
                    } else {
                      // Handle implementation for premium users
                      setActiveTab("implementation")
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Start Implementation
                </Button>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </PullToRefresh>

      {/* Mobile floating action button */}
      {isMobile && <FloatingActionButton actions={floatingActions} position="bottom-right" />}

      {/* Subscription Modal */}
      {subscriptionModal.featureType && (
        <SubscriptionModal
          isOpen={subscriptionModal.isOpen}
          onClose={closeSubscriptionModal}
          featureType={subscriptionModal.featureType as "vendors" | "download" | "roi" | "implementation"}
        />
      )}
    </>
  )
}
