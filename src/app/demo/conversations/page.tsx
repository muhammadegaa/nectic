import Link from "next/link"
import DemoLayout from "@/components/demo-layout"
import { WhatsAppIcon, ZoomIcon, FirefliesIcon, HubSpotIcon } from "@/components/brand-icons"
import { demoConversations, demoSignals } from "@/lib/demo-data"

const sourceUI = {
  whatsapp: {
    Icon: WhatsAppIcon,
    label: "WhatsApp",
    headerBg: "bg-[#075E54]",
    headerText: "text-white",
    bubbleBg: "bg-[#DCF8C6]",
    bubbleText: "text-neutral-800",
    border: "border-green-200",
    count: 31,
  },
  zoom: {
    Icon: ZoomIcon,
    label: "Zoom",
    headerBg: "bg-[#2D8CFF]",
    headerText: "text-white",
    bubbleBg: "bg-blue-50",
    bubbleText: "text-blue-900",
    border: "border-blue-200",
    count: 6,
  },
  fireflies: {
    Icon: FirefliesIcon,
    label: "Fireflies",
    headerBg: "bg-[#6C47FF]",
    headerText: "text-white",
    bubbleBg: "bg-violet-50",
    bubbleText: "text-violet-900",
    border: "border-violet-200",
    count: 3,
  },
  hubspot: {
    Icon: HubSpotIcon,
    label: "HubSpot",
    headerBg: "bg-[#FF7A59]",
    headerText: "text-white",
    bubbleBg: "bg-orange-50",
    bubbleText: "text-orange-900",
    border: "border-orange-200",
    count: 7,
  },
}

export default function ConversationsPage() {
  return (
    <DemoLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
            <span className="font-mono">Step 02</span>
            <span>·</span>
            <span>Conversations ingested</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Conversation feed</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Week of Feb 17–21 · 47 total across all sources · Showing 8
              </p>
            </div>
            <Link
              href="/demo/brief"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-neutral-900 text-white text-xs font-medium px-4 py-2 hover:bg-neutral-700 transition-colors rounded"
            >
              Next: see signals brief →
            </Link>
          </div>

          {/* Source summary */}
          <div className="mt-5 flex gap-3 flex-wrap">
            {Object.entries(sourceUI).map(([key, cfg]) => (
              <div key={key} className={`flex items-center gap-2 border ${cfg.border} bg-white rounded-lg px-3 py-2`}>
                <cfg.Icon size={16} />
                <span className="text-xs font-medium text-neutral-700">{cfg.label}</span>
                <span className="text-xs text-neutral-400">{cfg.count} convos</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {demoConversations.map((conv) => {
            const ui = sourceUI[conv.source as keyof typeof sourceUI]
            const signals = conv.signals.map((sid) => demoSignals.find((s) => s.id === sid)).filter(Boolean)

            if (conv.source === "whatsapp") {
              return <WhatsAppConversation key={conv.id} conv={conv} ui={ui} signals={signals} />
            }
            if (conv.source === "zoom" || conv.source === "fireflies") {
              return <ZoomConversation key={conv.id} conv={conv} ui={ui} signals={signals} />
            }
            return <HubSpotNote key={conv.id} conv={conv} ui={ui} signals={signals} />
          })}

          {/* Truncation indicator */}
          <div className="border border-dashed border-neutral-200 rounded-lg p-5 text-center bg-white">
            <p className="text-sm text-neutral-400">+ 39 more conversations not shown</p>
            <Link href="/#early-access" className="mt-1 inline-block text-xs text-neutral-500 hover:text-neutral-900 underline">
              Connect your sources to see real data →
            </Link>
          </div>
        </div>
      </div>
    </DemoLayout>
  )
}

type ConvProps = {
  conv: (typeof demoConversations)[0]
  ui: (typeof sourceUI)[keyof typeof sourceUI]
  signals: (typeof demoSignals[0] | undefined)[]
}

function WhatsAppConversation({ conv, ui, signals }: ConvProps) {
  return (
    <div className={`bg-white border ${ui.border} rounded-lg overflow-hidden`}>
      {/* WhatsApp-style header */}
      <div className={`${ui.headerBg} px-4 py-3 flex items-center gap-3`}>
        <ui.Icon size={18} />
        <div>
          <p className={`text-sm font-semibold ${ui.headerText}`}>{conv.sender}</p>
          <p className={`text-xs ${ui.headerText} opacity-80`}>{conv.company} · {conv.date}</p>
        </div>
        <span className={`ml-auto text-xs ${ui.headerText} opacity-60 bg-white/10 px-2 py-0.5 rounded`}>
          WhatsApp Business
        </span>
      </div>
      {/* Chat bubble */}
      <div className="p-4 bg-[#E5DDD5] min-h-[60px]">
        <div className={`inline-block max-w-[85%] ${ui.bubbleBg} rounded-lg rounded-tl-none px-3 py-2.5 shadow-sm`}>
          <p className={`text-sm ${ui.bubbleText} leading-relaxed`}>{conv.full}</p>
          <p className="text-[10px] text-neutral-400 text-right mt-1">{conv.date} ✓✓</p>
        </div>
      </div>
      <SignalFooter signals={signals} />
    </div>
  )
}

function ZoomConversation({ conv, ui, signals }: ConvProps) {
  const lines = conv.full.split(/\n/).filter(Boolean)
  return (
    <div className={`bg-white border ${ui.border} rounded-lg overflow-hidden`}>
      <div className={`${ui.headerBg} px-4 py-3 flex items-center gap-3`}>
        <ui.Icon size={18} />
        <div>
          <p className={`text-sm font-semibold ${ui.headerText}`}>{conv.sender}</p>
          <p className={`text-xs ${ui.headerText} opacity-80`}>{conv.company} · {conv.date}</p>
        </div>
        <span className={`ml-auto text-xs ${ui.headerText} opacity-60 bg-white/10 px-2 py-0.5 rounded`}>
          Call transcript
        </span>
      </div>
      <div className="p-4 space-y-2">
        {lines.map((line, i) => {
          const match = line.match(/^\[(\d+:\d+)\]\s+([^:]+):\s+(.+)$/)
          if (match) {
            const [, time, speaker, text] = match
            const isCustomer = !speaker.toLowerCase().includes("sales")
            return (
              <div key={i} className={`flex gap-3 ${isCustomer ? "" : "justify-end"}`}>
                {isCustomer && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    {speaker.trim()[0]}
                  </div>
                )}
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isCustomer ? `${ui.bubbleBg} ${ui.bubbleText}` : "bg-neutral-100 text-neutral-600"}`}>
                  <p className="text-[10px] font-medium opacity-60 mb-0.5">{speaker} · {time}</p>
                  <p className="text-sm leading-relaxed">{text}</p>
                </div>
                {!isCustomer && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600">
                    S
                  </div>
                )}
              </div>
            )
          }
          return <p key={i} className="text-xs text-neutral-400 italic">{line}</p>
        })}
      </div>
      <SignalFooter signals={signals} />
    </div>
  )
}

function HubSpotNote({ conv, ui, signals }: ConvProps) {
  return (
    <div className={`bg-white border ${ui.border} rounded-lg overflow-hidden`}>
      <div className={`${ui.headerBg} px-4 py-3 flex items-center gap-3`}>
        <ui.Icon size={18} />
        <div>
          <p className={`text-sm font-semibold ${ui.headerText}`}>{conv.sender}</p>
          <p className={`text-xs ${ui.headerText} opacity-80`}>{conv.company} · {conv.date}</p>
        </div>
        <span className={`ml-auto text-xs ${ui.headerText} opacity-60 bg-white/10 px-2 py-0.5 rounded`}>
          CRM note
        </span>
      </div>
      <div className="p-4 bg-orange-50/30">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
            <span className="text-sm">📝</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-500 mb-1.5">Deal note · {conv.date}</p>
            <p className="text-sm text-neutral-700 leading-relaxed">{conv.full}</p>
          </div>
        </div>
      </div>
      <SignalFooter signals={signals} />
    </div>
  )
}

function SignalFooter({ signals }: { signals: (typeof demoSignals[0] | undefined)[] }) {
  const valid = signals.filter(Boolean) as typeof demoSignals
  if (!valid.length) return null

  return (
    <div className="px-4 py-2.5 border-t border-neutral-100 bg-neutral-50 flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-neutral-400 font-medium">Nectic extracted:</span>
      {valid.map((s) => {
        const color = s.priority === "critical" ? "bg-red-50 text-red-600 border-red-200"
          : s.priority === "medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200"
          : "bg-neutral-100 text-neutral-600 border-neutral-200"
        return (
          <Link key={s.id} href={`/demo/insight/${s.id}`} className={`text-[11px] font-medium px-2 py-0.5 border rounded-full ${color} hover:opacity-70 transition-opacity`}>
            {s.title} →
          </Link>
        )
      })}
    </div>
  )
}
