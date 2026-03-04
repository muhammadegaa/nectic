import Link from "next/link"
import DemoLayout from "@/components/demo-layout"
import {
  WhatsAppIcon, ZoomIcon, FirefliesIcon, HubSpotIcon,
  JiraIcon, SlackIcon, LinearIcon, SalesforceIcon, NotionIcon,
} from "@/components/brand-icons"

const integrations = [
  {
    id: "whatsapp",
    icon: <WhatsAppIcon size={28} />,
    name: "WhatsApp Business",
    description: "Read sales & pre-sales conversations from your WhatsApp Business number.",
    category: "Conversation",
    status: "connected",
    stat: "31 conversations this week",
    via: "Meta Cloud API",
    steps: [
      "Create a WhatsApp Business account at business.whatsapp.com",
      "Apply for Cloud API access via Meta Business Suite (~48h approval)",
      "Paste your Nectic webhook URL and verify token",
      "Assign your sales team's number to the Nectic listener",
    ],
  },
  {
    id: "zoom",
    icon: <ZoomIcon size={28} />,
    name: "Zoom Meetings",
    description: "Auto-transcribe demo calls and discovery sessions via Zoom's recording API.",
    category: "Conversation",
    status: "connected",
    stat: "6 recordings this week",
    via: "Zoom OAuth",
    steps: [
      "Authorise Nectic in Zoom Marketplace",
      "Enable cloud recording in your Zoom account",
      "Transcripts sync automatically after each call ends",
    ],
  },
  {
    id: "fireflies",
    icon: <FirefliesIcon size={28} />,
    name: "Fireflies.ai",
    description: "Pull meeting notes and AI summaries from Fireflies across Google Meet, Teams, and Zoom.",
    category: "Conversation",
    status: "connected",
    stat: "3 summaries this week",
    via: "Fireflies API key",
    steps: [
      "Generate an API key in Fireflies Settings → Integrations",
      "Paste key in Nectic → Sources → Fireflies",
      "All future meetings Fireflies joins will sync automatically",
    ],
  },
  {
    id: "hubspot",
    icon: <HubSpotIcon size={28} />,
    name: "HubSpot CRM",
    description: "Ingest deal notes, call logs, and contact activity from your HubSpot pipelines.",
    category: "CRM",
    status: "connected",
    stat: "7 deal notes this week",
    via: "HubSpot OAuth",
    steps: [
      "Connect via HubSpot OAuth — takes 30 seconds",
      "Select which deal pipelines and stages to monitor",
      "Nectic reads notes, emails, and call dispositions (read-only)",
    ],
  },
  {
    id: "salesforce",
    icon: <SalesforceIcon size={28} />,
    name: "Salesforce",
    description: "Pull opportunity notes and Chatter posts from your Salesforce org.",
    category: "CRM",
    status: "available",
    stat: "Not connected",
    via: "Salesforce OAuth",
    steps: [],
  },
  {
    id: "jira",
    icon: <JiraIcon size={28} />,
    name: "Jira",
    description: "One-click ticket creation from any signal. Full context auto-populated.",
    category: "Output",
    status: "connected",
    stat: "3 tickets created this week",
    via: "Atlassian OAuth",
    steps: [
      "Authorise Nectic via Atlassian OAuth",
      "Choose default project, issue type, and assignee",
      "Click 'Create ticket' on any signal — done in 1 click",
    ],
  },
  {
    id: "slack",
    icon: <SlackIcon size={28} />,
    name: "Slack",
    description: "Weekly brief posted to #product every Monday at 8 AM.",
    category: "Output",
    status: "connected",
    stat: "Delivers Mon 8:00 AM",
    via: "Slack OAuth",
    steps: [
      "Add Nectic to your Slack workspace",
      "Choose the channel (e.g. #product-intel)",
      "Brief posts every Monday morning, your timezone",
    ],
  },
  {
    id: "linear",
    icon: <LinearIcon size={28} />,
    name: "Linear",
    description: "Auto-create issues in Linear from signals — with labels, priority, and context.",
    category: "Output",
    status: "available",
    stat: "Not connected",
    via: "Linear OAuth",
    steps: [],
  },
  {
    id: "notion",
    icon: <NotionIcon size={28} />,
    name: "Notion",
    description: "Push weekly briefs to a Notion database for async team review.",
    category: "Output",
    status: "available",
    stat: "Not connected",
    via: "Notion OAuth",
    steps: [],
  },
]

const categories = [
  { id: "Conversation", label: "Conversation sources", sub: "Where customer truth lives" },
  { id: "CRM", label: "CRM", sub: "Deal context & notes" },
  { id: "Output", label: "Outputs", sub: "Where intelligence lands" },
]

export default function ConnectPage() {
  const connected = integrations.filter((i) => i.status === "connected").length

  return (
    <DemoLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
            <span className="font-mono">Step 01</span>
            <span>·</span>
            <span>Connect your sources</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Integrations</h1>
              <p className="mt-1 text-sm text-neutral-500">
                {connected} of {integrations.length} connected · Read-only access · No data shared with third parties
              </p>
            </div>
            <Link
              href="/demo/conversations"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-neutral-900 text-white text-xs font-medium px-4 py-2 hover:bg-neutral-700 transition-colors rounded"
            >
              Next: see conversations →
            </Link>
          </div>
        </div>

        {categories.map(({ id, label, sub }) => {
          const items = integrations.filter((i) => i.category === id)
          return (
            <div key={id} className="mb-10">
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-sm font-semibold text-neutral-700">{label}</h2>
                <span className="text-xs text-neutral-400">{sub}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Data principles */}
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {[
            { icon: "🔒", title: "Read-only", body: "Nectic never sends messages or modifies data in any connected source." },
            { icon: "🔏", title: "Anonymised at ingest", body: "Sender names become role + company labels before storage. Raw PII is never retained." },
            { icon: "🗄️", title: "Your Firestore, always", body: "All signals are stored in your own instance. Delete anytime. Never used for training." },
          ].map((p) => (
            <div key={p.title} className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="text-lg mb-2">{p.icon}</div>
              <p className="text-sm font-medium text-neutral-800">{p.title}</p>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </DemoLayout>
  )
}

function IntegrationCard({ integration }: { integration: (typeof integrations)[0] }) {
  const isConnected = integration.status === "connected"

  return (
    <div className={`bg-white border rounded-lg p-4 flex flex-col gap-4 ${isConnected ? "border-neutral-200" : "border-dashed border-neutral-200 opacity-60"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{integration.icon}</div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{integration.name}</p>
            <p className="text-xs text-neutral-400 mt-0.5">via {integration.via}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
          isConnected ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-neutral-400"}`} />
          {isConnected ? "Connected" : "Available"}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-500 leading-relaxed">{integration.description}</p>

      {/* Stat */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <span className="text-xs font-medium text-neutral-700">{integration.stat}</span>
        {isConnected ? (
          <span className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded">
            ✓ Active
          </span>
        ) : (
          <Link href="/#early-access" className="text-xs text-neutral-900 font-medium bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-700 transition-colors">
            Connect
          </Link>
        )}
      </div>

      {/* Setup steps */}
      {isConnected && integration.steps.length > 0 && (
        <div className="pt-3 border-t border-neutral-50">
          <p className="text-xs font-medium text-neutral-400 mb-2">Setup ({integration.steps.length} steps)</p>
          <ol className="space-y-1.5">
            {integration.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-neutral-500">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
