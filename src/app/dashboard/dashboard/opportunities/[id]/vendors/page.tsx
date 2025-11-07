"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { opportunitiesData } from "@/lib/opportunities-data"

// Import vendor components
import { VendorCard } from "@/components/vendor-card"
import { VendorComparisonMatrix } from "@/components/vendor-comparison-matrix"
import { VendorROICalculator } from "@/components/vendor-roi-calculator"
import { VendorTestimonial } from "@/components/vendor-testimonial"
import { VendorImplementationGuide } from "@/components/vendor-implementation-guide"
import { ConnectWithCustomers } from "@/components/connect-with-customers"

// Mock vendor data
const vendors = [
  {
    id: "docusense",
    name: "DocuSense AI",
    description: "Enterprise-grade document processing with advanced AI capabilities for financial services",
    logoUrl: "/placeholder.svg?height=100&width=100",
    g2Rating: 4.7,
    g2ReviewCount: 387,
    customersLikeYou: 42,
    marketLeader: true,
    specialties: ["Financial Documents", "Compliance", "Automated Extraction", "Workflow Automation"],
    trustedBy: [
      { name: "Global Bank", logoUrl: "/placeholder.svg?height=50&width=100" },
      { name: "Fidelity Financial", logoUrl: "/placeholder.svg?height=50&width=100" },
      { name: "Capital One", logoUrl: "/placeholder.svg?height=50&width=100" },
      { name: "JP Morgan", logoUrl: "/placeholder.svg?height=50&width=100" },
    ],
    freeTrialAvailable: true,
    pricingTier: "premium",
    contractLength: "Annual or Multi-year",
    supportLevel: "premium",
    sla: "99.9% uptime, 4hr response",
    features: [
      { featureId: "feature-1", supported: true },
      { featureId: "feature-2", supported: true },
      { featureId: "feature-3", supported: "advanced", notes: "Industry-leading capabilities" },
      { featureId: "feature-4", supported: true },
      { featureId: "feature-5", supported: true },
      { featureId: "feature-6", supported: true },
      { featureId: "feature-7", supported: "advanced" },
      { featureId: "feature-8", supported: true },
      { featureId: "feature-9", supported: true },
      { featureId: "feature-10", supported: true },
      { featureId: "feature-11", supported: true },
      { featureId: "feature-12", supported: "advanced" },
    ],
    implementationTimeWeeks: 8,
    implementationCostMultiplier: 1.2,
    maintenanceCostPercentage: 15,
    efficiencyGainPercentage: 25,
    totalDuration: 8,
    phases: [
      {
        name: "Discovery & Planning",
        duration: 1,
        description: "Detailed analysis of your current workflows and requirements",
        tasks: ["Document current processes", "Define success metrics", "Create implementation roadmap"],
        resources: [
          {
            type: "business",
            level: "medium",
            description: "Process owners and subject matter experts",
          },
          {
            type: "it",
            level: "low",
            description: "IT architect for system assessment",
          },
        ],
      },
      {
        name: "Installation & Configuration",
        duration: 2,
        description: "Setting up the DocuSense AI platform in your environment",
        tasks: ["Install core platform", "Configure security settings", "Set up integrations with existing systems"],
        resources: [
          {
            type: "it",
            level: "high",
            description: "IT team for installation and configuration",
          },
          {
            type: "business",
            level: "low",
            description: "Business stakeholders for approval",
          },
        ],
      },
      {
        name: "Data Migration & Model Training",
        duration: 3,
        description: "Migrating existing data and training AI models",
        tasks: ["Migrate historical documents", "Train document recognition models", "Configure extraction rules"],
        resources: [
          {
            type: "it",
            level: "medium",
            description: "Data migration specialists",
          },
          {
            type: "business",
            level: "medium",
            description: "Subject matter experts for model training",
          },
        ],
      },
      {
        name: "Testing & Optimization",
        duration: 1,
        description: "Testing the solution with real data and optimizing performance",
        tasks: ["Conduct user acceptance testing", "Fine-tune AI models", "Optimize workflows"],
        resources: [
          {
            type: "business",
            level: "high",
            description: "End users for testing",
          },
          {
            type: "it",
            level: "medium",
            description: "IT support for troubleshooting",
          },
        ],
      },
      {
        name: "Training & Go-Live",
        duration: 1,
        description: "Training users and launching the solution",
        tasks: ["Conduct user training sessions", "Prepare documentation", "Go-live and support"],
        resources: [
          {
            type: "training",
            level: "high",
            description: "Trainers and change management",
          },
          {
            type: "business",
            level: "medium",
            description: "All end users",
          },
        ],
      },
    ],
    dataMigrationApproach:
      "DocuSense uses a phased migration approach with automated document classification and metadata extraction. Historical documents are processed in batches with validation workflows to ensure accuracy.",
    technicalRequirements: [
      "Windows Server 2019 or later / Linux (RHEL 8+)",
      "16GB RAM, 8 CPU cores minimum",
      "100GB storage for application, additional for documents",
      "Database: SQL Server 2019+ or PostgreSQL 13+",
      "Network: HTTPS, port 443 for web interface",
    ],
    trainingDetails: {
      duration: 3,
      format: "Instructor-led workshops and hands-on sessions",
      materials: ["Administrator guide", "User manual", "Video tutorials", "Interactive e-learning modules"],
    },
  },
  {
    id: "formcraft",
    name: "FormCraft",
    description: "User-friendly document automation platform with quick implementation for mid-sized companies",
    logoUrl: "/placeholder.svg?height=100&width=100",
    g2Rating: 4.5,
    g2ReviewCount: 215,
    customersLikeYou: 28,
    marketLeader: false,
    specialties: ["Form Processing", "Template-Based Extraction", "Cloud-Native", "Easy Integration"],
    trustedBy: [
      { name: "Regional Bank", logoUrl: "/placeholder.svg?height=50&width=100" },
      { name: "Credit Union", logoUrl: "/placeholder.svg?height=50&width=100" },
      { name: "Insurance Co", logoUrl: "/placeholder.svg?height=50&width=100" },
    ],
    freeTrialAvailable: true,
    pricingTier: "standard",
    contractLength: "Monthly or Annual",
    supportLevel: "standard",
    sla: "99.5% uptime, 8hr response",
    features: [
      { featureId: "feature-1", supported: true },
      { featureId: "feature-2", supported: true },
      { featureId: "feature-3", supported: true },
      { featureId: "feature-4", supported: "partial", notes: "Basic capabilities" },
      { featureId: "feature-5", supported: true },
      { featureId: "feature-6", supported: false },
      { featureId: "feature-7", supported: true },
      { featureId: "feature-8", supported: true },
      { featureId: "feature-9", supported: "partial" },
      { featureId: "feature-10", supported: true },
      { featureId: "feature-11", supported: false },
      { featureId: "feature-12", supported: true },
    ],
    implementationTimeWeeks: 4,
    implementationCostMultiplier: 0.8,
    maintenanceCostPercentage: 20,
    efficiencyGainPercentage: 15,
    totalDuration: 4,
    phases: [
      {
        name: "Setup & Configuration",
        duration: 1,
        description: "Quick setup of the cloud-based platform",
        tasks: ["Create account and configure settings", "Set up user permissions", "Configure basic integrations"],
        resources: [
          {
            type: "it",
            level: "low",
            description: "IT support for initial setup",
          },
          {
            type: "business",
            level: "low",
            description: "Business stakeholder for approval",
          },
        ],
      },
      {
        name: "Template Creation",
        duration: 1,
        description: "Creating document templates for automated processing",
        tasks: ["Identify key document types", "Create extraction templates", "Set up validation rules"],
        resources: [
          {
            type: "business",
            level: "medium",
            description: "Subject matter experts for template design",
          },
          {
            type: "it",
            level: "low",
            description: "IT support as needed",
          },
        ],
      },
      {
        name: "Workflow Configuration",
        duration: 1,
        description: "Setting up automated workflows",
        tasks: ["Configure document routing", "Set up approval workflows", "Create notification rules"],
        resources: [
          {
            type: "business",
            level: "medium",
            description: "Process owners for workflow design",
          },
          {
            type: "it",
            level: "low",
            description: "IT support for integration",
          },
        ],
      },
      {
        name: "Training & Go-Live",
        duration: 1,
        description: "Training users and launching the solution",
        tasks: ["Conduct user training", "Perform final testing", "Go-live and monitor"],
        resources: [
          {
            type: "training",
            level: "medium",
            description: "Trainers for end users",
          },
          {
            type: "business",
            level: "medium",
            description: "All end users",
          },
        ],
      },
    ],
    dataMigrationApproach:
      "FormCraft uses a template-based approach for data migration. The platform focuses on new documents with optional historical document import using pre-built templates.",
    technicalRequirements: [
      "Cloud-based SaaS - no on-premises infrastructure required",
      "Modern web browser (Chrome, Firefox, Edge)",
      "Internet connection with 10+ Mbps",
      "Single Sign-On: SAML 2.0 support (optional)",
      "API access for custom integrations (REST API)",
    ],
    trainingDetails: {
      duration: 1,
      format: "Virtual training sessions and self-paced learning",
      materials: ["User guide", "Video tutorials", "Knowledge base access", "Quick reference cards"],
    },
  },
  {
    id: "intelligentdocs",
    name: "Intelligent Docs",
    description: "Specialized AI document processing platform for financial services with advanced compliance features",
    logoUrl: "/placeholder.svg?height=100&width=100",
    g2Rating: 4.3,
    g2ReviewCount: 178,
    customersLikeYou: 35,
    marketLeader: false,
    specialties: ["Compliance Automation", "Financial Document Analysis", "Regulatory Reporting", "Audit Trails"],
    trustedBy: [
      { name: "First National", logoUrl: "/placeholder.svg?height=50&width=100" },
      { name: "Wealth Partners", logoUrl: "/placeholder.svg?height=50&width=100" },
      { name: "Secure Finance", logoUrl: "/placeholder.svg?height=50&width=100" },
    ],
    freeTrialAvailable: false,
    pricingTier: "premium",
    contractLength: "Annual",
    supportLevel: "premium",
    sla: "99.9% uptime, 2hr response",
    features: [
      { featureId: "feature-1", supported: true },
      { featureId: "feature-2", supported: "partial" },
      { featureId: "feature-3", supported: "advanced", notes: "Financial services specific" },
      { featureId: "feature-4", supported: true },
      { featureId: "feature-5", supported: "advanced", notes: "Regulatory compliance focused" },
      { featureId: "feature-6", supported: true },
      { featureId: "feature-7", supported: true },
      { featureId: "feature-8", supported: false },
      { featureId: "feature-9", supported: "advanced" },
      { featureId: "feature-10", supported: true },
      { featureId: "feature-11", supported: true },
      { featureId: "feature-12", supported: "advanced" },
    ],
    implementationTimeWeeks: 10,
    implementationCostMultiplier: 1.5,
    maintenanceCostPercentage: 18,
    efficiencyGainPercentage: 30,
    totalDuration: 10,
    phases: [
      {
        name: "Discovery & Requirements",
        duration: 2,
        description: "Detailed analysis of compliance requirements and workflows",
        tasks: ["Document current processes", "Identify compliance requirements", "Define success criteria"],
        resources: [
          {
            type: "business",
            level: "high",
            description: "Compliance officers and process owners",
          },
          {
            type: "it",
            level: "medium",
            description: "IT architects for system assessment",
          },
        ],
      },
      {
        name: "Installation & Security Setup",
        duration: 2,
        description: "Secure installation with compliance controls",
        tasks: ["Install core platform", "Configure security and compliance settings", "Set up audit trails"],
        resources: [
          {
            type: "it",
            level: "high",
            description: "IT security team for implementation",
          },
          {
            type: "business",
            level: "medium",
            description: "Compliance team for validation",
          },
        ],
      },
      {
        name: "Compliance Configuration",
        duration: 3,
        description: "Setting up compliance rules and workflows",
        tasks: ["Configure regulatory rules", "Set up approval workflows", "Create compliance reporting"],
        resources: [
          {
            type: "business",
            level: "high",
            description: "Compliance specialists for rule configuration",
          },
          {
            type: "it",
            level: "medium",
            description: "IT support for integration",
          },
        ],
      },
      {
        name: "Data Migration & Testing",
        duration: 2,
        description: "Secure data migration with compliance validation",
        tasks: ["Migrate historical documents", "Validate data integrity", "Perform compliance testing"],
        resources: [
          {
            type: "it",
            level: "high",
            description: "Data migration specialists",
          },
          {
            type: "business",
            level: "high",
            description: "Compliance team for validation",
          },
        ],
      },
      {
        name: "Training & Go-Live",
        duration: 1,
        description: "Comprehensive training and controlled rollout",
        tasks: ["Conduct role-based training", "Perform user acceptance testing", "Phased go-live approach"],
        resources: [
          {
            type: "training",
            level: "high",
            description: "Specialized trainers for compliance workflows",
          },
          {
            type: "business",
            level: "high",
            description: "All users and compliance team",
          },
        ],
      },
    ],
    dataMigrationApproach:
      "Intelligent Docs uses a compliance-focused migration approach with full audit trails and chain of custody documentation. Historical documents are migrated with comprehensive metadata and compliance tagging.",
    technicalRequirements: [
      "Windows Server 2019 or later",
      "32GB RAM, 16 CPU cores recommended",
      "256GB storage plus document storage",
      "Database: SQL Server 2019+ (Enterprise Edition)",
      "Network: Secure HTTPS, dedicated ports for services",
      "Security: LDAP/Active Directory integration",
    ],
    trainingDetails: {
      duration: 5,
      format: "Role-based training with compliance certification",
      materials: [
        "Compliance procedures manual",
        "Administrator guide",
        "End-user manual",
        "Compliance certification materials",
        "Video tutorials",
      ],
    },
  },
]

// Features for comparison matrix
const features = [
  {
    id: "feature-1",
    name: "Document OCR & Extraction",
    category: "core",
    description: "Extract text and data from scanned documents using OCR technology",
    financialServicesRelevance: "high",
  },
  {
    id: "feature-2",
    name: "Template-Based Processing",
    category: "core",
    description: "Process documents using pre-defined templates",
    financialServicesRelevance: "medium",
  },
  {
    id: "feature-3",
    name: "Financial Document Analysis",
    category: "industry",
    description: "Specialized processing for financial documents like statements, applications, and contracts",
    financialServicesRelevance: "high",
  },
  {
    id: "feature-4",
    name: "Workflow Automation",
    category: "workflow",
    description: "Automate document routing and approval workflows",
    financialServicesRelevance: "medium",
  },
  {
    id: "feature-5",
    name: "Compliance Controls",
    category: "compliance",
    description: "Built-in controls for regulatory compliance",
    financialServicesRelevance: "high",
  },
  {
    id: "feature-6",
    name: "Audit Trails",
    category: "compliance",
    description: "Comprehensive logging of all document actions",
    financialServicesRelevance: "high",
  },
  {
    id: "feature-7",
    name: "Data Validation",
    category: "core",
    description: "Automated validation of extracted data",
    financialServicesRelevance: "medium",
  },
  {
    id: "feature-8",
    name: "Mobile Capture",
    category: "accessibility",
    description: "Capture documents using mobile devices",
    financialServicesRelevance: "low",
  },
  {
    id: "feature-9",
    name: "Regulatory Reporting",
    category: "compliance",
    description: "Generate reports for regulatory compliance",
    financialServicesRelevance: "high",
  },
  {
    id: "feature-10",
    name: "API Integration",
    category: "integration",
    description: "Connect with other systems via APIs",
    financialServicesRelevance: "medium",
  },
  {
    id: "feature-11",
    name: "Salesforce Integration",
    category: "integration",
    description: "Direct integration with Salesforce",
    financialServicesRelevance: "medium",
  },
  {
    id: "feature-12",
    name: "AI-Powered Classification",
    category: "ai",
    description: "Automatically classify documents using AI",
    financialServicesRelevance: "medium",
  },
]

// Customer references for connecting with customers
const customerReferences = [
  {
    id: "customer-1",
    name: "Sarah Johnson",
    title: "Director of Operations",
    company: "First National Bank",
    industry: "Banking",
    availableVia: ["call", "email"],
  },
  {
    id: "customer-2",
    name: "Michael Chen",
    title: "CTO",
    company: "Pacific Financial Services",
    industry: "Financial Services",
    availableVia: ["meeting", "email"],
  },
  {
    id: "customer-3",
    name: "Jennifer Williams",
    title: "VP of Digital Transformation",
    company: "Capital Investment Group",
    industry: "Investment Banking",
    availableVia: ["call", "meeting", "email"],
  },
]

export default function VendorSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState("overview")

  // Find the opportunity by ID
  const opportunity = opportunitiesData.find((opp) => opp.id === id)

  // If opportunity not found, show error
  if (!opportunity) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Opportunity Not Found</h1>
        <p className="text-muted-foreground mb-6">The opportunity you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/app/opportunities")}>
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

  // Handle schedule demo
  const handleScheduleDemo = (vendorId: string) => {
    // In a real implementation, this would open a calendar scheduling dialog
    alert(`Scheduling demo for ${vendors.find((v) => v.id === vendorId)?.name}`)
  }

  // Handle download brief
  const handleDownloadBrief = (vendorId: string) => {
    // In a real implementation, this would download a PDF
    alert(`Downloading brief for ${vendors.find((v) => v.id === vendorId)?.name}`)
  }

  // Handle start free trial
  const handleStartFreeTrial = (vendorId: string) => {
    // In a real implementation, this would redirect to the vendor's free trial page
    alert(`Starting free trial for ${vendors.find((v) => v.id === vendorId)?.name}`)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/app/opportunities/${id}`)}
          className="group transition-all duration-200 hover:border-amber-500 hover:bg-amber-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Opportunity
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">Vendor Selection</h1>
        <p className="text-muted-foreground">Compare and select the best vendor for implementing {(opportunity as any).name || (opportunity as any).title}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            id={vendor.id}
            name={vendor.name}
            description={vendor.description}
            logoUrl={vendor.logoUrl}
            g2Rating={vendor.g2Rating}
            g2ReviewCount={vendor.g2ReviewCount}
            customersLikeYou={vendor.customersLikeYou}
            marketLeader={vendor.marketLeader}
            specialties={vendor.specialties}
            trustedBy={vendor.trustedBy}
            freeTrialAvailable={vendor.freeTrialAvailable}
            onScheduleDemo={handleScheduleDemo}
            onDownloadBrief={handleDownloadBrief}
            onStartFreeTrial={vendor.freeTrialAvailable ? handleStartFreeTrial : undefined}
          />
        ))}
      </div>

      <Tabs
        defaultValue="comparison"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="space-y-4"
      >
        <TabsList className="bg-muted/30 p-1 h-auto">
          {["comparison", "roi", "implementation", "testimonials", "connect"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={`
                capitalize px-6 py-2.5 text-sm font-medium transition-all duration-200
                data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm
                data-[state=active]:border-b-[3px] data-[state=active]:border-amber-500
                hover:text-amber-600
              `}
            >
              {tab === "roi" ? "ROI Calculator" : tab === "connect" ? "Connect with Customers" : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
              <CardDescription>Compare features across vendors to find the best fit</CardDescription>
            </CardHeader>
            <CardContent>
              <VendorComparisonMatrix vendors={vendors as any} features={features} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          <VendorROICalculator
            vendors={vendors.map((v) => ({
              id: v.id,
              name: v.name,
              logoUrl: v.logoUrl,
              implementationTimeWeeks: v.implementationTimeWeeks,
              implementationCostMultiplier: v.implementationCostMultiplier,
              maintenanceCostPercentage: v.maintenanceCostPercentage,
              efficiencyGainPercentage: v.efficiencyGainPercentage,
            }))}
            initialMonthlySavings={opportunity.monthlySavings}
            initialImplementationCost={opportunity.monthlySavings * 3}
          />
        </TabsContent>

        <TabsContent value="implementation">
          <VendorImplementationGuide
            vendors={vendors.map((v) => ({
              id: v.id,
              name: v.name,
              logoUrl: v.logoUrl,
              totalDuration: v.totalDuration,
              phases: v.phases,
              dataMigrationApproach: v.dataMigrationApproach,
              technicalRequirements: v.technicalRequirements,
              trainingDetails: v.trainingDetails,
            })) as any}
          />
        </TabsContent>

        <TabsContent value="testimonials">
          <Card>
            <CardHeader>
              <CardTitle>Customer Testimonials</CardTitle>
              <CardDescription>Hear from financial services companies using these solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <VendorTestimonial
                  quote="DocuSense AI transformed our loan processing workflow. We've reduced processing time by 75% and improved accuracy significantly."
                  authorName="Robert Chen"
                  authorTitle="VP of Operations"
                  authorCompany="First National Bank"
                  metrics={[
                    { label: "Processing Time Reduction", value: "75%" },
                    { label: "Error Rate Reduction", value: "92%" },
                    { label: "Annual Savings", value: "$420K" },
                    { label: "ROI", value: "385%" },
                  ]}
                />
                <VendorTestimonial
                  quote="FormCraft was easy to implement and gave us quick wins. The template-based approach worked well for our standardized documents."
                  authorName="Lisa Johnson"
                  authorTitle="Director of Digital Transformation"
                  authorCompany="Regional Credit Union"
                  metrics={[
                    { label: "Implementation Time", value: "4 weeks" },
                    { label: "Processing Time Reduction", value: "60%" },
                    { label: "Annual Savings", value: "$180K" },
                    { label: "ROI", value: "240%" },
                  ]}
                />
                <VendorTestimonial
                  quote="Intelligent Docs' compliance features are unmatched. We've streamlined our regulatory reporting and reduced audit preparation time significantly."
                  authorName="Michael Williams"
                  authorTitle="Chief Compliance Officer"
                  authorCompany="Capital Investment Group"
                  metrics={[
                    { label: "Compliance Time Reduction", value: "65%" },
                    { label: "Audit Preparation Reduction", value: "80%" },
                    { label: "Annual Savings", value: "$350K" },
                    { label: "ROI", value: "310%" },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connect">
          <ConnectWithCustomers
            vendorId="docusense"
            vendorName="DocuSense AI"
            customerReferences={customerReferences as any}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Comparison Report
        </Button>
        <Button className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Schedule Vendor Demos
        </Button>
      </div>
    </div>
  )
}
