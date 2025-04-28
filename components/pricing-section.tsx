import { Badge } from "@/components/ui/badge"
import { PricingCard } from "@/components/pricing-card"

export function PricingSection() {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-amber-50/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 max-w-3xl">
            <Badge variant="outline" className="mb-2 bg-white">
              <span className="text-primary animate-pulse">🔥 Current Pricing</span>
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Subscription Plans</h2>
            <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Choose the plan that best fits your business needs
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
          <PricingCard
            title="Standard Plan"
            description="For businesses starting their AI journey"
            priceUSD={249}
            earlyAdopterPriceUSD={199}
            features={[
              "AI opportunity assessment",
              "Top 3 implementation guides",
              "Basic vendor comparisons",
              "AI solution recommendations",
            ]}
            plan="standard"
            popular={false}
          />

          <PricingCard
            title="Premium Plan"
            description="For businesses serious about AI transformation"
            priceUSD={499}
            earlyAdopterPriceUSD={399}
            features={[
              "<strong>Complete</strong> AI opportunity assessment",
              "<strong>Unlimited</strong> implementation guides",
              "Advanced vendor comparisons with ROI calculators",
              "<strong>Priority</strong> access to new features",
            ]}
            plan="premium"
            popular={true}
          />
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mt-6">
          <p className="inline-flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 text-primary"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
            </svg>
            30-day money-back guarantee
          </p>
        </div>
        {/* How does billing work? */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            How does billing work?
            <br />
            Your card will be charged immediately when you subscribe. We offer a 30-day money-back guarantee if you're
            not satisfied with our service.
          </p>
        </div>
      </div>
    </section>
  )
}
