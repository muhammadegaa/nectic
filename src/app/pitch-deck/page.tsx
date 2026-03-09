"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"

const ORANGE = "#F5A623"
const WA_GREEN = "#25D366"

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 6 C26 28 20 46 20 64 A30 30 0 0 0 80 64 C80 46 74 28 50 6 Z"
        stroke={ORANGE} strokeWidth="5.5" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ name, size = 20, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  const paths: Record<string, React.ReactNode> = {
    upload:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    scan:     <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>,
    draft:    <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    send:     <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    shield:   <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
    chart:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    check:    <><polyline points="20 6 9 17 4 12"/></>,
    globe:    <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    arrow:    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    zap:      <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    target:   <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    maximize: <><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>,
    minimize: <><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></>,
    message:  <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    sparkle:  <><path d="M12 3l1.5 5h5l-4 3 1.5 5L12 13l-4 3 1.5-5-4-3h5z"/></>,
    check2:   <><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></>,
  }
  return <svg {...props}>{paths[name]}</svg>
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-5 flex items-center gap-2" style={{ color: ORANGE }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ORANGE }} />
      {children}
    </p>
  )
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[42px] font-light leading-[1.1] tracking-[-0.025em] text-white mb-0">{children}</h2>
}

// ─── SLIDE 1: COVER ───────────────────────────────────────────────────────────
function S1Cover() {
  return (
    <div className="flex h-full">
      <div className="flex flex-col justify-between p-16 flex-1">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <span className="text-white text-base font-semibold tracking-tight">Nectic</span>
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-600 mb-8">
            AI-Native Customer Success · Southeast Asia
          </p>
          <h1 className="text-[60px] font-light leading-[1.06] tracking-[-0.03em] text-white mb-7">
            Every at-risk account.<br />
            <span className="text-neutral-500">Caught before</span><br />
            <span className="text-neutral-500">it costs you.</span>
          </h1>
          <p className="text-[15px] text-neutral-500 max-w-sm leading-relaxed">
            The churn prevention system for WhatsApp-first B2B SaaS in Indonesia and Malaysia.
          </p>
        </div>
        <div className="flex items-start gap-8">
          {[
            { n: "3B+",  l: "WhatsApp monthly\nactive users globally" },
            { n: "80%",  l: "of businesses in ID/MY use\nWhatsApp for customer comms" },
            { n: "0",    l: "CS tools built for\nWhatsApp-first teams in SEA" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-8">
              {i > 0 && <div className="w-px h-10 bg-neutral-800 mt-1" />}
              <div>
                <div className="text-2xl font-light text-white tabular-nums">{s.n}</div>
                <div className="text-xs text-neutral-600 mt-1 whitespace-pre-line leading-relaxed">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-[300px] bg-[#0a0a0a] border-l border-neutral-800/60 flex flex-col justify-center p-12 gap-7 flex-shrink-0">
        {[
          { icon: "message", label: "Signal detected in WhatsApp conversation" },
          { icon: "scan",    label: "At-risk account surfaced instantly" },
          { icon: "draft",   label: "Response drafted in your team's voice" },
          { icon: "send",    label: "Delivered to customer on WhatsApp" },
          { icon: "shield",  label: "ARR protected — tracked and reported" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.45 }} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0 text-neutral-500">
              <Icon name={item.icon} size={15} />
            </div>
            <span className="text-[13px] text-neutral-500 leading-snug">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── SLIDE 2: PROBLEM ─────────────────────────────────────────────────────────
function S2Problem() {
  return (
    <div className="flex h-full flex-col p-16 gap-8">
      <div>
        <Eyebrow>The Problem</Eyebrow>
        <H2>CS teams are flying blind.<br /><span className="text-neutral-500">Churn signals live in WhatsApp. Nobody&apos;s watching.</span></H2>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-8 flex flex-col gap-5">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-700">Without Nectic</p>
          {[
            "CS manager spends 2–3 hrs reading WhatsApp threads manually — every single day.",
            "Churn signal fires Friday evening. Team sees it Tuesday. Account already cold.",
            "Risk discovered 3 weeks late — when CS finally escalates it in Slack.",
            "Gainsight costs $50K+/yr. Requires Salesforce. Has zero WhatsApp support.",
          ].map((t, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-4 h-4 rounded-full bg-red-950 border border-red-900/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </div>
              <p className="text-[13px] text-neutral-500 leading-relaxed">{t}</p>
            </div>
          ))}
        </div>
        <div className="border border-neutral-700/30 rounded-2xl p-8 flex flex-col gap-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-700">With Nectic</p>
          {[
            "Agent scans every account overnight. Queue shows only what needs a decision today.",
            "Signal detected the moment it appears. Draft response already waiting for review.",
            "Unactioned critical signal after 3 days? Re-alert fires automatically.",
            "ARR digest delivered every Monday. Revenue saved, accounts protected — no manual work.",
          ].map((t, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[13px] text-neutral-300 leading-relaxed">{t}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-l-2 pl-5 text-[13px] text-neutral-600 leading-relaxed" style={{ borderColor: ORANGE }}>
        If Nectic disappears tomorrow, your CS team reverts to manual WhatsApp triage. Accounts slip. Churn happens two weeks later.{" "}
        <span className="text-neutral-400 font-medium">That&apos;s the test of whether something is mission-critical.</span>
      </div>
    </div>
  )
}

// ─── SLIDE 3: WHY NOW ─────────────────────────────────────────────────────────
function S3WhyNow() {
  return (
    <div className="flex h-full flex-col p-16 gap-9">
      <div>
        <Eyebrow>Why Now</Eyebrow>
        <H2>WhatsApp is the OS for B2B in SEA.<br /><span className="text-neutral-500">AI can finally read it.</span></H2>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {[
          { num: "3B+",  label: "WhatsApp monthly active users globally — the default B2B communication channel across Indonesia and Malaysia.", src: "Meta, May 2025" },
          { num: "22%",  label: "CAGR of SEA's B2B SaaS market through 2029, growing from $3.2B to $8.6B. CS tooling hasn't kept pace.", src: "Industry analysis, 2024" },
          { num: "$50K", label: "Gainsight median annual contract. No WhatsApp. No path to the SEA mid-market. The category is wide open.", src: "Vendr, 279 buyers, 2024" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1, duration: 0.45 }} className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-7">
            <div className="text-[48px] font-light tracking-[-0.05em] mb-4 leading-none" style={{ color: i === 2 ? "#ef4444" : "white" }}>{s.num}</div>
            <p className="text-[13px] text-neutral-500 leading-relaxed mb-3">{s.label}</p>
            <p className="text-[10px] text-neutral-700 font-medium tracking-[0.1em]">{s.src}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-6">
          <div className="text-[13px] font-semibold text-white mb-2">LLMs now parse unstructured chat reliably</div>
          <div className="text-[13px] text-neutral-500 leading-relaxed">Nectic extracts churn signals from raw WhatsApp exports in Bahasa Indonesia, Malay, and English — including natural code-switching. Production quality reached in 2024.</div>
        </div>
        <div className="rounded-xl p-6 border" style={{ background: ORANGE + "08", borderColor: ORANGE + "30" }}>
          <div className="text-[13px] font-semibold text-white mb-2">The competitive window is open — for now</div>
          <div className="text-[13px] text-neutral-500 leading-relaxed">Agency (Elias Torres, $20M Series A from Menlo Ventures + Sequoia) is moving toward this space. The first-mover window in SEA is 12–18 months.</div>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 4: THE LOOP ────────────────────────────────────────────────────────
function S4Loop() {
  const steps = [
    { n: "01", icon: "upload", title: "Connect",  body: "CS lead shares a WhatsApp conversation. Any format, any date range, any language." },
    { n: "02", icon: "scan",   title: "Detect",   body: "AI reads every message. Surfaces risk signals, sentiment drift, silence patterns — instantly." },
    { n: "03", icon: "draft",  title: "Draft",    body: "A response is generated in your team's actual voice — evidence-backed, ready to review." },
    { n: "04", icon: "send",   title: "Approve",  body: "One tap. The message is delivered to the customer on WhatsApp, from a real number." },
    { n: "→",  icon: "shield", title: "Protected", body: "Signal resolved. Account health updated. ARR protected — logged and reported.", accent: true },
  ]
  return (
    <div className="flex h-full flex-col p-16 gap-9">
      <div>
        <Eyebrow>How It Works</Eyebrow>
        <H2>One closed loop. <span className="text-neutral-500">From signal to resolution.</span></H2>
      </div>
      <div className="flex gap-3 flex-1">
        {steps.map((step, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.09, duration: 0.4 }}
            className={`flex-1 rounded-2xl p-6 flex flex-col gap-4 border ${step.accent ? "bg-white border-white/10" : "bg-[#0a0a0a] border-neutral-800/60"}`}>
            <div className={`text-[10px] font-bold tracking-[0.14em] ${step.accent ? "text-neutral-400" : "text-neutral-700"}`}>{step.n}</div>
            <div className={step.accent ? "text-neutral-400" : "text-neutral-600"}><Icon name={step.icon} size={20} /></div>
            <div className={`text-[15px] font-semibold ${step.accent ? "text-neutral-900" : "text-white"}`}>{step.title}</div>
            <div className={`text-[12px] leading-relaxed ${step.accent ? "text-neutral-500" : "text-neutral-500"}`}>{step.body}</div>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border px-6 py-4 flex items-center gap-5" style={{ background: ORANGE + "0a", borderColor: ORANGE + "25" }}>
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase whitespace-nowrap" style={{ color: ORANGE }}>The Experience</div>
        <div className="w-px h-5 bg-neutral-800" />
        <p className="text-[13px] leading-relaxed" style={{ color: ORANGE + "bb" }}>
          The customer receives a perfectly timed, human-sounding message on WhatsApp. The CS team never had to write it. The account manager never had to remember to follow up. <span style={{ color: ORANGE }} className="font-semibold">That&apos;s the seamless experience.</span>
        </p>
      </div>
    </div>
  )
}

// ─── SLIDE 5: INTERACTIVE DEMO ────────────────────────────────────────────────
const DEMO_STEPS = [
  {
    label: "The conversation",
    hint: "A customer conversation — unread in WhatsApp for 3 days",
  },
  {
    label: "Signal detected",
    hint: "Nectic flags the at-risk signals automatically",
  },
  {
    label: "Draft ready",
    hint: "A response is drafted in the account manager's voice",
  },
  {
    label: "Delivered",
    hint: "Customer receives it on WhatsApp. CS lead never typed a word.",
  },
]

const CHAT_MESSAGES = [
  { from: "customer", name: "Budi (PT Mandiri)", text: "Halo, kita lagi evaluate beberapa tools nih termasuk Qontak", time: "Mon 09:14", risk: true },
  { from: "vendor",   name: "Anda",              text: "Oh iya, ada concern spesifik yang bisa kita bantu?", time: "Mon 09:47" },
  { from: "customer", name: "Budi (PT Mandiri)", text: "Fitur export data kita butuh banget tapi belum ada", time: "Mon 10:02", risk: true },
  { from: "customer", name: "Budi (PT Mandiri)", text: "Btw budget Q2 kita kayaknya bakal dikurangin 30%", time: "Thu 14:33", risk: true, gap: true },
]

function WaAvatar({ name, vendor }: { name: string; vendor?: boolean }) {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
      style={{ background: vendor ? "#1a1a2e" : "#064e3b", color: vendor ? "#818cf8" : "#34d399" }}>
      {name[0]}
    </div>
  )
}

function SDemoFlow({ onAdvanceSlide }: { onAdvanceSlide: () => void }) {
  const [step, setStep] = useState(0)
  const [sending, setSending] = useState(false)

  const advance = useCallback(() => {
    if (step === 2) {
      setSending(true)
      setTimeout(() => { setSending(false); setStep(3) }, 900)
    } else if (step < DEMO_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      onAdvanceSlide()
    }
  }, [step, onAdvanceSlide])

  // Space/enter within demo advances demo step (handled at top level via onDemoStep)
  return (
    <div className="flex h-full flex-col">
      {/* Step header */}
      <div className="flex items-center justify-between px-16 pt-10 pb-6 flex-shrink-0">
        <div>
          <Eyebrow>Live Demo</Eyebrow>
          <H2>
            <AnimatePresence mode="wait">
              <motion.span key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="inline-block">
                {DEMO_STEPS[step].label}
              </motion.span>
            </AnimatePresence>
            {step < 2 && <span className="text-neutral-500"> — {DEMO_STEPS[step].hint}</span>}
          </H2>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {DEMO_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${i === step ? "text-white border" : i < step ? "text-neutral-600" : "text-neutral-800"}`}
                style={{ borderColor: i === step ? ORANGE + "60" : "transparent", background: i === step ? ORANGE + "12" : "transparent" }}>
                {i < step
                  ? <span style={{ color: WA_GREEN }}><Icon name="check2" size={13} color={WA_GREEN} /></span>
                  : <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px]" style={{ borderColor: i === step ? ORANGE : "#333", color: i === step ? ORANGE : "#555" }}>{i + 1}</span>
                }
                <span className={i <= step ? "text-neutral-400" : "text-neutral-700"}>{s.label}</span>
              </div>
              {i < DEMO_STEPS.length - 1 && <div className="w-4 h-px" style={{ background: i < step ? WA_GREEN + "60" : "#222" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Main demo area */}
      <div className="flex flex-1 gap-0 px-16 pb-8 gap-6 overflow-hidden">

        {/* WhatsApp Panel */}
        <div className="flex-1 bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl overflow-hidden flex flex-col">
          {/* WA header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/60" style={{ background: "#111" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: "#064e3b", color: "#34d399" }}>P</div>
            <div>
              <div className="text-[13px] font-semibold text-white">PT Mandiri Teknologi</div>
              <div className="text-[10px] text-neutral-600">WhatsApp Business Chat</div>
            </div>
            <div className="ml-auto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill={WA_GREEN}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.524 5.836L.036 23.785l6.094-1.597A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.626 0 11.999 0zm.001 21.818a9.818 9.818 0 0 1-5.027-1.38l-.36-.214-3.718.975 1.003-3.609-.235-.373A9.818 9.818 0 0 1 2.18 12c0-5.422 4.399-9.818 9.82-9.818 5.422 0 9.819 4.396 9.819 9.818 0 5.421-4.397 9.818-9.819 9.818z"/></svg>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
            {CHAT_MESSAGES.map((msg, i) => (
              <div key={i}>
                {msg.gap && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-neutral-800/60" />
                    <span className="text-[10px] text-neutral-700">3 days later</span>
                    <div className="flex-1 h-px bg-neutral-800/60" />
                  </div>
                )}
                <motion.div
                  initial={false}
                  animate={{ opacity: 1 }}
                  className={`flex gap-2 ${msg.from === "vendor" ? "flex-row-reverse" : ""}`}
                >
                  <WaAvatar name={msg.name} vendor={msg.from === "vendor"} />
                  <div className="max-w-[75%]">
                    <motion.div
                      className={`px-3 py-2 rounded-xl text-[12px] leading-relaxed transition-all duration-500 ${msg.from === "vendor" ? "text-white" : "text-neutral-200"}`}
                      animate={{
                        background: step >= 1 && msg.risk
                          ? "rgba(239,68,68,0.12)"
                          : msg.from === "vendor" ? "#1e3a5f" : "#1a1a1a",
                        borderColor: step >= 1 && msg.risk ? "rgba(239,68,68,0.4)" : "transparent",
                        borderWidth: step >= 1 && msg.risk ? 1 : 0,
                        borderStyle: "solid",
                      }}
                    >
                      {step >= 1 && msg.risk && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-semibold text-red-400 mb-1 flex items-center gap-1">
                          <Icon name="sparkle" size={10} color="#f87171" /> Risk signal
                        </motion.div>
                      )}
                      {msg.text}
                    </motion.div>
                    <div className="text-[10px] text-neutral-700 mt-1 px-1">{msg.time}</div>
                  </div>
                </motion.div>
              </div>
            ))}

            {/* Delivered message — step 3 */}
            <AnimatePresence>
              {step === 3 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-2 flex-row-reverse">
                  <WaAvatar name="Anda" vendor />
                  <div className="max-w-[80%]">
                    <div className="px-3 py-2 rounded-xl text-[12px] leading-relaxed text-white" style={{ background: "#1e3a5f" }}>
                      Halo Pak Budi, terima kasih sudah share feedback-nya. Soal fitur export data, tim kami sudah prioritaskan untuk sprint bulan depan dan kami ingin ajak diskusi dulu untuk pastikan sesuai kebutuhan. Untuk budget Q2, ada opsi yang bisa kita sesuaikan — boleh kita jadwalkan 15 menit minggu ini?
                    </div>
                    <div className="text-[10px] text-neutral-700 mt-1 px-1 flex items-center gap-1">
                      Just now
                      <span style={{ color: WA_GREEN }}>✓✓</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nectic Panel */}
        <div className="w-[380px] bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl overflow-hidden flex flex-col flex-shrink-0">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800/60" style={{ background: "#111" }}>
            <Logo size={14} />
            <span className="text-[12px] font-semibold text-neutral-400">Nectic</span>
            {step >= 1 && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto text-[10px] font-semibold text-orange-400 bg-orange-950 px-2 py-0.5 rounded-full border border-orange-900/60">
                1 account needs action
              </motion.span>
            )}
          </div>

          <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
            {/* Step 0: idle state */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-700">
                  <Icon name="scan" size={18} />
                </div>
                <p className="text-[12px] text-neutral-700">Monitoring conversations<br />across all accounts</p>
              </motion.div>
            )}

            {/* Step 1+: Account card */}
            {step >= 1 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900 border border-neutral-800/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-800/60 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-medium text-white">PT Mandiri Teknologi</div>
                    <div className="text-[10px] text-neutral-600 mt-0.5">$24K ARR · Renewal Mar 2026</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-950 border border-orange-900/60 px-2 py-1 rounded-md flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    HIGH
                  </span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-2">
                  {[
                    "Competitor evaluation (Qontak)",
                    "Feature gap mentioned",
                    "Budget pressure for Q2",
                    "3-day communication gap",
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2 text-[11px] text-red-400">
                      <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                      {s}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2+: Draft */}
            {step >= 2 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-neutral-900 border border-neutral-800/60 rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 border-b border-neutral-800/60 flex items-center gap-2">
                  <Icon name="draft" size={12} color="#737373" />
                  <span className="text-[11px] text-neutral-600 font-medium">Draft response</span>
                  <span className="ml-auto text-[10px] text-neutral-700">AI · your voice</span>
                </div>
                <div className="flex-1 px-4 py-3">
                  <p className="text-[12px] text-neutral-300 leading-relaxed">
                    Halo Pak Budi, terima kasih sudah share feedback-nya. Soal fitur export data, tim kami sudah prioritaskan untuk sprint bulan depan dan kami ingin ajak diskusi dulu untuk pastikan sesuai kebutuhan. Untuk budget Q2, ada opsi yang bisa kita sesuaikan — boleh kita jadwalkan 15 menit minggu ini?
                  </p>
                </div>
                <div className="px-4 py-3 border-t border-neutral-800/60 flex gap-2">
                  <button className="flex-1 text-[12px] text-neutral-600 border border-neutral-800 rounded-lg py-2 hover:border-neutral-700 transition-colors">Edit</button>
                  <motion.button
                    onClick={advance}
                    disabled={sending}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 text-[12px] font-semibold text-black rounded-lg py-2 flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: sending ? "#a3a3a3" : ORANGE }}
                  >
                    {sending ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full" />
                    ) : (
                      <><Icon name="send" size={11} color="black" /> Approve & Send</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-950 border border-emerald-900/60 rounded-xl px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="check2" size={16} color={WA_GREEN} />
                  <span className="text-[13px] font-semibold text-emerald-300">Delivered to WhatsApp</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700">Signal resolved · Health updated</span>
                  <span className="font-semibold" style={{ color: ORANGE }}>$16K ARR protected</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-16 pb-10 flex items-center justify-between flex-shrink-0">
        <p className="text-[12px] text-neutral-700">
          {step < 3 ? DEMO_STEPS[step].hint : "CS lead approved one message. Account saved. No manual work."}
        </p>
        {step !== 2 && (
          <motion.button
            onClick={advance}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 text-[13px] font-medium px-5 py-2.5 rounded-xl border transition-all"
            style={step === DEMO_STEPS.length - 1
              ? { background: ORANGE + "15", borderColor: ORANGE + "40", color: ORANGE }
              : { background: "#161616", borderColor: "#333", color: "#a3a3a3" }
            }
          >
            {step === DEMO_STEPS.length - 1 ? "Continue →" : "Next step"}
            {step < DEMO_STEPS.length - 1 && <Icon name="arrow" size={13} color="#555" />}
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ─── SLIDE 6: PRODUCT ─────────────────────────────────────────────────────────
function S6Product() {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col justify-center p-16 gap-9">
        <div>
          <Eyebrow>Product</Eyebrow>
          <H2>Built for the Head of CS.<br /><span className="text-neutral-500">Not the analyst.</span></H2>
        </div>
        <p className="text-[14px] text-neutral-500 leading-relaxed max-w-xs">
          The CS lead sees a queue of accounts that need attention today. One tap to approve the draft. The message reaches the customer. Nothing else to do.
        </p>
        <div className="flex flex-col gap-4">
          {[
            { icon: "scan",    t: "Signal detection in Bahasa Indonesia & Malay" },
            { icon: "draft",   t: "Human-voice draft generation from conversation history" },
            { icon: "send",    t: "One-tap delivery to customer on WhatsApp" },
            { icon: "chart",   t: "ARR protection tracking & automated weekly digest" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-neutral-600"><Icon name={f.icon} size={16} /></div>
              <span className="text-[13px] text-neutral-400">{f.t}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-[380px] flex items-center justify-center bg-[#0a0a0a] border-l border-neutral-800/60 p-12 flex-shrink-0">
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full bg-white rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium text-neutral-900">PT Mandiri Teknologi</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Growth · $24K ARR · Renewal Mar 2026</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-md flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />HIGH
            </span>
          </div>
          <div className="px-5 py-4 border-b border-neutral-100">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[28px] font-light text-red-500 tabular-nums">$16K</span>
              <span className="text-[13px] text-neutral-400">ARR at risk</span>
              <span className="ml-auto text-[11px] text-red-400 font-medium">health 4/10</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full w-[40%] bg-orange-400 rounded-full" />
            </div>
          </div>
          <div className="bg-orange-50 border-b border-orange-100 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[11px] font-semibold text-orange-700">Competitor mentioned</span>
              <span className="ml-auto text-[10px] text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded">Qontak</span>
            </div>
            <p className="text-[13px] text-neutral-800 leading-relaxed">&ldquo;Kita lagi coba Qontak juga bulan ini, nanti kita compare hasilnya...&rdquo;</p>
          </div>
          <div className="px-5 py-3.5 flex items-center gap-2.5">
            <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 text-[9px] font-bold flex-shrink-0">AI</span>
            <span className="text-[12px] text-neutral-500">Draft retention message — save $16K ARR</span>
            <span className="ml-auto text-[12px] font-semibold" style={{ color: ORANGE }}>Approve →</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ─── SLIDE 7: MARKET ──────────────────────────────────────────────────────────
function S7Market() {
  return (
    <div className="flex h-full flex-col p-16 gap-9">
      <div>
        <Eyebrow>Market &amp; Competition</Eyebrow>
        <H2>A clear gap. <span className="text-neutral-500">A 12-month window to own it.</span></H2>
      </div>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="flex-1 rounded-2xl p-7 border" style={{ background: ORANGE + "08", borderColor: ORANGE + "35" }}>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-3" style={{ color: ORANGE }}>Beachhead · ID + MY</p>
            <div className="text-[48px] font-light tracking-[-0.05em] mb-3 leading-none" style={{ color: ORANGE }}>~400</div>
            <p className="text-[13px] text-neutral-500 leading-relaxed">B2B SaaS companies with $1M–$20M ARR and a dedicated CS function. WhatsApp-first. Underserved by every tool on the market.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="flex-1 bg-[#0a0a0a] rounded-2xl p-7 border border-neutral-800/60">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600 mb-3">SEA B2B SaaS Market</p>
            <div className="text-[48px] font-light text-white tracking-[-0.05em] mb-3 leading-none">$8.6B</div>
            <p className="text-[13px] text-neutral-500 leading-relaxed">By 2029 (22% CAGR from $3.2B in 2024). CS tooling for SEA mid-market is a decade behind the market it serves.</p>
          </motion.div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-5 gap-2 px-3 pb-3 border-b border-neutral-800/60">
            <div />
            {["WhatsApp", "SEA Pricing", "Auto-Draft", "Direct Send"].map(h => (
              <div key={h} className="text-[10px] font-semibold text-neutral-700 text-center tracking-[0.1em] uppercase">{h}</div>
            ))}
          </div>
          {[
            { name: "Gainsight",     vals: [false, false, "~", false] },
            { name: "ChurnZero",     vals: [false, false, "~", false] },
            { name: "Vitally",       vals: [false, "~",   "~", false] },
            { name: "Intercom Fin",  vals: ["~",   "~",   true, false] },
            { name: "Agency (Kai)",  vals: ["~",   "~",   true, false] },
          ].map((row) => (
            <div key={row.name} className="grid grid-cols-5 gap-2 px-3 py-2.5 rounded-xl border border-neutral-800/40">
              <div className="text-[13px] text-neutral-500 font-medium">{row.name}</div>
              {row.vals.map((v, i) => (
                <div key={i} className="text-center text-[13px]">
                  {v === true ? <span className="text-emerald-500">✓</span> : v === "~" ? <span className="text-neutral-600">~</span> : <span className="text-neutral-800">—</span>}
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2 px-3 py-3 rounded-xl border" style={{ background: ORANGE + "0d", borderColor: ORANGE + "35" }}>
            <div className="text-[13px] font-bold text-white">Nectic</div>
            {[true, true, true, true].map((_, i) => (
              <div key={i} className="text-center text-[13px] font-semibold" style={{ color: ORANGE }}>✓</div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-700 leading-relaxed pt-1 pl-1">
            The moat is the willingness to do the unsexy work — parsing messy exports, understanding Bahasa/Malay, delivering directly to WhatsApp — in a market that looks too small from San Francisco.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 8: BUSINESS MODEL ──────────────────────────────────────────────────
function S8BizModel() {
  return (
    <div className="flex h-full flex-col p-16 gap-9">
      <div>
        <Eyebrow>Business Model</Eyebrow>
        <H2>SaaS today. <span className="text-neutral-500">Outcome-based as we scale.</span></H2>
      </div>
      <div className="grid grid-cols-3 gap-5 flex-1">
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-7 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600 mb-2">Starter</p>
            <div className="text-[40px] font-light text-white tracking-[-0.04em] leading-none">$149</div>
            <div className="text-[12px] text-neutral-600 mt-1">/ month · 20 accounts</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {["WhatsApp analysis + signal detection", "Auto-drafted responses", "Email re-alerts"].map(f => (
              <div key={f} className="flex items-center gap-2 text-[12px] text-neutral-500">
                <span className="text-emerald-500"><Icon name="check" size={13} /></span>{f}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-7 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-400">Growth</p>
              <span className="text-[9px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded tracking-wider">RECOMMENDED</span>
            </div>
            <div className="text-[40px] font-light text-neutral-900 tracking-[-0.04em] leading-none">$299</div>
            <div className="text-[12px] text-neutral-400 mt-1">/ month · 100 accounts</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {["Everything in Starter", "One-tap delivery to WhatsApp", "ARR protection dashboard", "Weekly leadership digest", "Alert preference controls"].map(f => (
              <div key={f} className="flex items-center gap-2 text-[12px] text-neutral-600">
                <span className="text-emerald-500"><Icon name="check" size={13} /></span>{f}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-7 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600 mb-5">Unit Economics</p>
            <div className="flex flex-col gap-0">
              {[
                { l: "ACV (Growth)",   v: "$3,588",       hi: true },
                { l: "10 pilots",      v: "~$36K ARR",    hi: true },
                { l: "Payback period", v: "< 1 month"              },
                { l: "Expansion",      v: "More accounts"          },
                { l: "Roadmap",        v: "% of ARR protected"     },
              ].map(r => (
                <div key={r.l} className="flex justify-between items-baseline border-b border-neutral-800/60 py-2.5">
                  <span className="text-[11px] text-neutral-600">{r.l}</span>
                  <span className="text-[13px] font-semibold" style={{ color: r.hi ? ORANGE : "#737373" }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed mt-4">
            One saved $24K ARR account covers the full year. That&apos;s the ROI conversation with every CS lead.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 9: ASK ─────────────────────────────────────────────────────────────
function S9Ask() {
  return (
    <div className="flex h-full flex-col p-16 gap-9">
      <div>
        <Eyebrow>The Ask</Eyebrow>
        <H2>Join us to own churn prevention<br /><span className="text-neutral-500">for B2B SaaS in Southeast Asia.</span></H2>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-8 flex flex-col gap-3">
          <div className="text-neutral-700 mb-1"><Icon name="shield" size={18} /></div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600">What we have</p>
          <p className="text-[14px] font-medium text-white leading-snug">Working product. End-to-end.</p>
          <p className="text-[13px] text-neutral-500 leading-relaxed">WhatsApp conversation → AI detection → auto-draft → one-tap delivery → ARR tracked. Full loop in 60 seconds. Live at nectic.vercel.app today.</p>
        </div>
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-8 flex flex-col gap-3">
          <div className="text-neutral-700 mb-1"><Icon name="users" size={18} /></div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600">What we need</p>
          <p className="text-[14px] font-medium text-white leading-snug">Co-founder. CS / RevOps background.</p>
          <p className="text-[13px] text-neutral-500 leading-relaxed">Deep network among Heads of CS at B2B SaaS companies in ID or MY. Can unlock 10 paying pilots in 90 days from existing relationships.</p>
        </div>
        <div className="rounded-2xl p-8 flex flex-col gap-3 border" style={{ background: ORANGE + "08", borderColor: ORANGE + "30" }}>
          <div className="mb-1"><Icon name="target" size={18} color={ORANGE} /></div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: ORANGE }}>90-Day Target</p>
          <p className="text-[14px] font-medium text-white leading-snug">10 paying pilots. 1 closed loop documented.</p>
          <p className="text-[13px] text-neutral-500 leading-relaxed">Signal detected → message delivered → ARR protected. One real example on record changes every subsequent investor conversation.</p>
        </div>
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-8 flex flex-col gap-3">
          <div className="text-neutral-700 mb-1"><Icon name="zap" size={18} /></div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600">Why Now</p>
          <p className="text-[14px] font-medium text-white leading-snug">First-mover window is open — closing fast.</p>
          <p className="text-[13px] text-neutral-500 leading-relaxed">Well-funded competitors are moving toward WhatsApp. The team that closes 10 pilots in SEA in the next 90 days owns this category.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Slide registry ────────────────────────────────────────────────────────────
const SLIDES_DEF = [
  { id: 1, label: "Cover",           component: S1Cover,    isDemo: false },
  { id: 2, label: "Problem",         component: S2Problem,  isDemo: false },
  { id: 3, label: "Why Now",         component: S3WhyNow,   isDemo: false },
  { id: 4, label: "How It Works",    component: S4Loop,     isDemo: false },
  { id: 5, label: "Demo",            component: null,       isDemo: true  },
  { id: 6, label: "Product",         component: S6Product,  isDemo: false },
  { id: 7, label: "Market",          component: S7Market,   isDemo: false },
  { id: 8, label: "Business Model",  component: S8BizModel, isDemo: false },
  { id: 9, label: "The Ask",         component: S9Ask,      isDemo: false },
]

const variants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 56 : -56 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -56 : 56 }),
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function PitchDeck() {
  const [current,      setCurrent]      = useState(0)
  const [direction,    setDirection]    = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const demoAdvanceRef = useRef<(() => void) | null>(null)

  const go = useCallback((next: number) => {
    if (next < 0 || next >= SLIDES_DEF.length) return
    setDirection(next > current ? 1 : -1)
    setCurrent(next)
  }, [current])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(current + 1) }
      if (e.key === "ArrowLeft")                   { e.preventDefault(); go(current - 1) }
      if (e.key === "f" || e.key === "F")           toggleFullscreen()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [current, go])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const slide = SLIDES_DEF[current]

  return (
    <div className="fixed inset-0 flex flex-col select-none" style={{ background: "#0d0d0d", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={current} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 flex flex-col">
            {slide.isDemo
              ? <SDemoFlow onAdvanceSlide={() => go(current + 1)} />
              : slide.component && <slide.component />
            }
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav bar */}
      <div className="h-12 border-t border-neutral-800/50 flex items-center justify-between px-8 flex-shrink-0" style={{ background: "#0d0d0d" }}>
        <div className="flex items-center gap-2">
          <Logo size={16} />
          <span className="text-[11px] font-semibold text-neutral-600 tracking-tight">Nectic</span>
        </div>

        <div className="flex items-center gap-1.5">
          {SLIDES_DEF.map((s, i) => (
            <button key={i} onClick={() => go(i)} title={s.label} className="h-6 flex items-center px-0.5">
              <div className="h-1 rounded-full transition-all duration-300"
                style={{ width: i === current ? 20 : 5, background: i === current ? (s.isDemo ? WA_GREEN : ORANGE) : "#333" }} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-700 tabular-nums">{current + 1} / {SLIDES_DEF.length}</span>
          <button onClick={() => go(current - 1)} disabled={current === 0}
            className="w-7 h-7 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-600 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-default transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <button onClick={() => go(current + 1)} disabled={current === SLIDES_DEF.length - 1}
            className="w-7 h-7 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-600 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-default transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            className="w-7 h-7 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-600 hover:text-white hover:border-neutral-600 transition-all">
            <Icon name={isFullscreen ? "minimize" : "maximize"} size={12} />
          </button>
        </div>
      </div>

      {current === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 text-[10px] text-neutral-800 pointer-events-none tracking-widest uppercase">
          Arrow keys to navigate · F for fullscreen
        </motion.div>
      )}
    </div>
  )
}
