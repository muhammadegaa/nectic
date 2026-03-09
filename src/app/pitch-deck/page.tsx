"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

const ORANGE = "#F5A623"
const WA_GREEN = "#25D366"

function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 6 C26 28 20 46 20 64 A30 30 0 0 0 80 64 C80 46 74 28 50 6 Z"
        stroke={ORANGE} strokeWidth="5.5" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function Icon({ name, size = 20, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  const d: Record<string, React.ReactNode> = {
    upload:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    scan:     <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    draft:    <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    send:     <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    shield:   <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
    check:    <><polyline points="20 6 9 17 4 12"/></>,
    check2:   <><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></>,
    message:  <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    chart:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    target:   <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    zap:      <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    maximize: <><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>,
    minimize: <><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></>,
    chevl:    <><polyline points="15 18 9 12 15 6"/></>,
    chevr:    <><polyline points="9 6 15 12 9 18"/></>,
  }
  return <svg {...p}>{d[name]}</svg>
}

// ─── SLIDE 1: COVER ───────────────────────────────────────────────────────────
function S1Cover() {
  return (
    <div className="flex h-full">
      {/* Left — pure headline */}
      <div className="flex flex-col justify-between p-16 flex-1">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="text-white text-[15px] font-semibold tracking-tight">Nectic</span>
        </div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-[64px] font-light leading-[1.04] tracking-[-0.035em] text-white mb-8"
          >
            Know which account<br />
            is about to churn.<br />
            <span style={{ color: ORANGE }}>Before they tell you.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="text-[16px] text-neutral-500 leading-relaxed"
          >
            AI-native churn prevention for WhatsApp-first<br />B2B SaaS in Southeast Asia.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
          className="flex items-center gap-10"
        >
          {[
            { n: "3B+",  l: "WhatsApp MAU globally" },
            { n: "80%",  l: "B2B comms in ID/MY on WhatsApp" },
            { n: "0",    l: "CS tools built for this" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-10">
              {i > 0 && <div className="w-px h-8 bg-neutral-800" />}
              <div>
                <div className="text-[22px] font-light text-white tabular-nums">{s.n}</div>
                <div className="text-[11px] text-neutral-700 mt-0.5">{s.l}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right — product proof */}
      <div className="w-[300px] flex flex-col justify-center bg-[#0a0a0a] border-l border-neutral-800/50 p-10 gap-3 flex-shrink-0">
        {/* Mini account card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        >
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <div className="text-[12px] font-semibold text-neutral-900">PT Mandiri Teknologi</div>
              <div className="text-[10px] text-neutral-400">$24K ARR · Renewal Mar 2026</div>
            </div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">HIGH</span>
          </div>
          <div className="bg-orange-50 border-b border-orange-100 px-4 py-3">
            <div className="text-[10px] font-semibold text-orange-700 mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" /> Competitor mentioned
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">&ldquo;Kita lagi coba Qontak juga bulan ini...&rdquo;</p>
          </div>
          <div className="px-4 py-2.5 flex items-center gap-2">
            <div className="text-[9px] font-bold text-neutral-400 bg-neutral-100 rounded px-1.5 py-0.5">AI</div>
            <span className="text-[11px] text-neutral-500">Draft retention message</span>
            <span className="ml-auto text-[11px] font-semibold" style={{ color: ORANGE }}>Send →</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}
          className="text-[10px] text-neutral-700 text-center leading-relaxed"
        >
          Signal detected · Draft ready · One tap to send
        </motion.div>
      </div>
    </div>
  )
}

// ─── SLIDE 2: PROBLEM ─────────────────────────────────────────────────────────
function S2Problem() {
  return (
    <div className="flex h-full flex-col justify-center p-16 gap-12">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: ORANGE }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ORANGE }} />
          The Problem
        </p>
        <h2 className="text-[48px] font-light leading-[1.08] tracking-[-0.028em] text-white max-w-3xl">
          Churn signals are hiding in WhatsApp.<br />
          <span className="text-neutral-500">Your CS team finds out 3 weeks too late.</span>
        </h2>
      </div>

      {/* The gap — before/after, bold and minimal */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0d0d0d] border border-neutral-800/50 rounded-2xl p-8">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-neutral-700 mb-6">Today</p>
          <div className="flex flex-col gap-5">
            {[
              { t: "2–3 hrs", d: "CS spends manually reading WhatsApp every day" },
              { t: "3 weeks", d: "average lag from signal to action" },
              { t: "$50K+",   d: "Gainsight annual contract — no WhatsApp, no SEA" },
            ].map((s, i) => (
              <div key={i} className="flex items-baseline gap-4">
                <span className="text-[28px] font-light text-red-400 tabular-nums w-28 flex-shrink-0">{s.t}</span>
                <span className="text-[13px] text-neutral-600 leading-relaxed">{s.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-neutral-700/30 rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-neutral-700 mb-6">With Nectic</p>
          <div className="flex flex-col gap-5">
            {[
              { t: "60 sec",    d: "from WhatsApp conversation to risk signal + draft" },
              { t: "Day 1",     d: "signal detected and actioned — not 3 weeks later" },
              { t: "$299/mo",   d: "everything included — built for SEA mid-market" },
            ].map((s, i) => (
              <div key={i} className="flex items-baseline gap-4">
                <span className="text-[28px] font-light tabular-nums w-28 flex-shrink-0" style={{ color: WA_GREEN }}>{s.t}</span>
                <span className="text-[13px] text-neutral-400 leading-relaxed">{s.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[13px] text-neutral-700 border-l-2 pl-5 leading-relaxed max-w-2xl" style={{ borderColor: ORANGE }}>
        If Nectic disappears tomorrow, your CS team goes back to reading WhatsApp manually.
        Accounts slip. <span className="text-neutral-400">Churn happens two weeks later — that&apos;s the test of mission-critical.</span>
      </p>
    </div>
  )
}

// ─── SLIDE 3: WHY NOW ─────────────────────────────────────────────────────────
function S3WhyNow() {
  return (
    <div className="flex h-full flex-col justify-center p-16 gap-12">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: ORANGE }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ORANGE }} />
          Why Now
        </p>
        <h2 className="text-[48px] font-light leading-[1.08] tracking-[-0.028em] text-white">
          WhatsApp is the OS for B2B in SEA.<br />
          <span className="text-neutral-500">AI can finally read it.</span>
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {[
          { num: "3B+",  sub: "WhatsApp MAU globally", body: "Default B2B communication channel across Indonesia and Malaysia — not email, not Slack.", src: "Meta, May 2025" },
          { num: "22%",  sub: "SEA SaaS CAGR to 2029", body: "Market grows from $3.2B to $8.6B. CS tooling for the SEA mid-market hasn't kept pace.", src: "Industry analysis, 2024" },
          { num: "0",    sub: "funded tools for this", body: "No company combines WhatsApp signal analysis, auto-drafting, and direct delivery for B2B SaaS in SEA.", src: "Competitive analysis, 2026", accent: true },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1, duration: 0.45 }}
            className="bg-[#0a0a0a] border border-neutral-800/50 rounded-2xl p-8 flex flex-col gap-3">
            <div className="text-[52px] font-light tracking-[-0.05em] leading-none" style={{ color: s.accent ? ORANGE : "white" }}>{s.num}</div>
            <div className="text-[11px] font-semibold text-neutral-600 tracking-[0.08em] uppercase">{s.sub}</div>
            <p className="text-[13px] text-neutral-500 leading-relaxed flex-1">{s.body}</p>
            <p className="text-[10px] text-neutral-800 font-medium">{s.src}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl p-5 border grid grid-cols-2 gap-6" style={{ background: ORANGE + "07", borderColor: ORANGE + "25" }}>
        <div>
          <div className="text-[13px] font-semibold text-white mb-1">LLMs now parse Bahasa Indonesia reliably</div>
          <div className="text-[12px] text-neutral-500 leading-relaxed">Extracting churn signals from unstructured WhatsApp exports — including Bahasa/English code-switching — reached production quality in 2024. The technical window is open.</div>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-white mb-1">12–18 month first-mover window</div>
          <div className="text-[12px] text-neutral-500 leading-relaxed">Agency (Elias Torres, $20M Series A from Menlo Ventures + Sequoia) is the nearest threat moving toward this space. The team that ships 10 pilots in SEA first wins.</div>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 4: HOW IT WORKS ────────────────────────────────────────────────────
function S4Loop() {
  return (
    <div className="flex h-full flex-col justify-center p-16 gap-10">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: ORANGE }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ORANGE }} />
          How It Works
        </p>
        <h2 className="text-[48px] font-light leading-[1.08] tracking-[-0.028em] text-white">
          Signal to resolution.<br />
          <span className="text-neutral-500">Automatically.</span>
        </h2>
      </div>

      <div className="flex items-stretch gap-2">
        {[
          { n: "01", icon: "upload", title: "Connect",  body: "CS shares a WhatsApp conversation. Any size, any language, any date range." },
          { n: "02", icon: "scan",   title: "Detect",   body: "AI reads every message. Surfaces risk signals, sentiment drift, and silence patterns." },
          { n: "03", icon: "draft",  title: "Draft",    body: "A response is generated in your team's actual voice — evidence-backed, ready to review." },
          { n: "04", icon: "send",   title: "Approve",  body: "One tap. The message reaches the customer on WhatsApp. From a real number." },
          { n: "05", icon: "shield", title: "Protected", body: "Signal resolved. Health updated. ARR protected and logged.", accent: true },
        ].map((step, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.08, duration: 0.45 }}
            className={`flex-1 rounded-2xl p-6 flex flex-col gap-5 border ${step.accent ? "bg-white border-white/10" : "bg-[#0a0a0a] border-neutral-800/50"}`}>
            <div className={`text-[10px] font-bold tracking-[0.16em] ${step.accent ? "text-neutral-400" : "text-neutral-700"}`}>{step.n}</div>
            <div className={step.accent ? "text-neutral-400" : "text-neutral-600"}>
              <Icon name={step.icon} size={22} />
            </div>
            <div>
              <div className={`text-[16px] font-semibold mb-2 ${step.accent ? "text-neutral-900" : "text-white"}`}>{step.title}</div>
              <div className={`text-[12px] leading-relaxed ${step.accent ? "text-neutral-500" : "text-neutral-500"}`}>{step.body}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border px-7 py-5" style={{ background: ORANGE + "08", borderColor: ORANGE + "22" }}>
        <p className="text-[14px] leading-relaxed text-neutral-400">
          The customer receives a perfectly timed, human-sounding message on WhatsApp.
          The CS team never had to write it. The account manager never had to remember to follow up.{" "}
          <span className="text-white font-medium">That&apos;s the seamless experience.</span>
        </p>
      </div>
    </div>
  )
}

// ─── SLIDE 5: DEMO ────────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { label: "The conversation",  hint: "A customer chat — unread for 3 days" },
  { label: "Signal detected",   hint: "Nectic flags every risk pattern automatically" },
  { label: "Draft ready",       hint: "A response drafted in the account manager's voice" },
  { label: "Delivered",         hint: "Customer receives it on WhatsApp. Zero manual work." },
]

const CHAT = [
  { from: "c", name: "Budi", text: "Halo, kita lagi evaluate beberapa tools nih termasuk Qontak", time: "Mon 09:14", risk: true },
  { from: "v", name: "You",  text: "Oh iya, ada concern spesifik yang bisa kita bantu?", time: "Mon 09:47" },
  { from: "c", name: "Budi", text: "Fitur export data kita butuh banget tapi belum ada di platform kalian", time: "Mon 10:02", risk: true },
  { from: "c", name: "Budi", text: "Btw budget Q2 kita kayaknya bakal dikurangin 30%", time: "Thu 14:33", risk: true, gap: true },
]

function SDemoFlow({ onAdvanceSlide }: { onAdvanceSlide: () => void }) {
  const [step, setSending] = useState(0)
  const [loading, setLoading] = useState(false)

  const advance = useCallback(() => {
    if (step === 2) {
      setLoading(true)
      setTimeout(() => { setLoading(false); setSending(3) }, 800)
    } else if (step < 3) {
      setSending(s => s + 1)
    } else {
      onAdvanceSlide()
    }
  }, [step, onAdvanceSlide])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-16 pt-10 pb-5 flex-shrink-0 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4 flex items-center gap-2" style={{ color: WA_GREEN }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: WA_GREEN }} />
            Live Demo
          </p>
          <AnimatePresence mode="wait">
            <motion.h2 key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
              className="text-[42px] font-light leading-[1.1] tracking-[-0.025em] text-white">
              {DEMO_STEPS[step].label}
              {step < 3 && <span className="text-neutral-600"> — {DEMO_STEPS[step].hint}</span>}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Progress pills */}
        <div className="flex items-center gap-2 pb-1">
          {DEMO_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className="w-5 h-px" style={{ background: i <= step ? WA_GREEN + "50" : "#222" }} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all duration-300 ${i === step ? "border-green-800 bg-green-950/50 text-green-400" : i < step ? "border-transparent text-neutral-600" : "border-transparent text-neutral-800"}`}>
                {i < step
                  ? <Icon name="check2" size={13} color={WA_GREEN} />
                  : <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px]" style={{ borderColor: i === step ? WA_GREEN : "#333", color: i === step ? WA_GREEN : "#555" }}>{i + 1}</span>
                }
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo panels */}
      <div className="flex flex-1 px-16 pb-5 gap-5 overflow-hidden min-h-0">

        {/* WhatsApp */}
        <div className="flex-1 bg-[#0a0a0a] border border-neutral-800/50 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/50 bg-[#111] flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: "#064e3b", color: WA_GREEN }}>P</div>
            <div>
              <div className="text-[13px] font-medium text-white">PT Mandiri Teknologi</div>
              <div className="text-[10px] text-neutral-600">WhatsApp Business</div>
            </div>
            <div className="ml-auto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill={WA_GREEN} opacity="0.7">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M11.999 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.524 5.836L.036 23.785l6.094-1.597A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.626 0 11.999 0zm.001 21.818a9.818 9.818 0 0 1-5.027-1.38l-.36-.214-3.718.975 1.003-3.609-.235-.373A9.818 9.818 0 0 1 2.18 12c0-5.422 4.399-9.818 9.82-9.818 5.422 0 9.819 4.396 9.819 9.818 0 5.421-4.397 9.818-9.819 9.818z"/>
              </svg>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
            {CHAT.map((msg, i) => (
              <div key={i}>
                {msg.gap && (
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-neutral-800/60" />
                    <span className="text-[10px] text-neutral-700 px-2">3 days later</span>
                    <div className="flex-1 h-px bg-neutral-800/60" />
                  </div>
                )}
                <div className={`flex gap-2 ${msg.from === "v" ? "flex-row-reverse" : ""}`}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: msg.from === "v" ? "#1e3a5f" : "#064e3b", color: msg.from === "v" ? "#93c5fd" : WA_GREEN }}>
                    {msg.from === "v" ? "A" : "B"}
                  </div>
                  <div className="max-w-[78%]">
                    <motion.div
                      animate={{
                        background: step >= 1 && msg.risk ? "rgba(239,68,68,0.1)" : msg.from === "v" ? "#1e3a5f" : "#1c1c1c",
                        borderColor: step >= 1 && msg.risk ? "rgba(239,68,68,0.35)" : "transparent",
                      }}
                      className="px-3 py-2 rounded-xl text-[12px] leading-relaxed text-neutral-200 border transition-all duration-500"
                    >
                      {step >= 1 && msg.risk && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-[10px] font-semibold text-red-400 mb-1">
                          ↑ Risk signal
                        </motion.div>
                      )}
                      {msg.text}
                    </motion.div>
                    <div className="text-[9px] text-neutral-700 mt-0.5 px-1">{msg.time}</div>
                  </div>
                </div>
              </div>
            ))}

            <AnimatePresence>
              {step === 3 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-2 flex-row-reverse">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "#1e3a5f", color: "#93c5fd" }}>A</div>
                  <div className="max-w-[82%]">
                    <div className="px-3 py-2.5 rounded-xl text-[12px] leading-relaxed text-neutral-200 border" style={{ background: "#1e3a5f", borderColor: "#2d4a7a" }}>
                      Halo Pak Budi, terima kasih sudah share feedback-nya. Soal fitur export, tim kami sudah prioritaskan untuk sprint bulan depan. Untuk budget Q2, ada opsi yang bisa kita sesuaikan — boleh jadwalkan 15 menit minggu ini?
                    </div>
                    <div className="text-[9px] text-neutral-700 mt-0.5 px-1 flex items-center gap-1">
                      Just now <span style={{ color: WA_GREEN }}>✓✓</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nectic */}
        <div className="w-[360px] bg-[#0a0a0a] border border-neutral-800/50 rounded-2xl flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800/50 bg-[#111] flex-shrink-0">
            <Logo size={14} />
            <span className="text-[12px] font-semibold text-neutral-500">Nectic</span>
            <AnimatePresence>
              {step >= 1 && (
                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="ml-auto text-[10px] font-semibold text-orange-400 bg-orange-950 border border-orange-900/50 px-2 py-0.5 rounded-full">
                  1 account flagged
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
            {step === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-700">
                  <Icon name="scan" size={18} />
                </div>
                <p className="text-[12px] text-neutral-700">Monitoring all conversations</p>
              </div>
            )}

            {step >= 1 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900 border border-neutral-800/50 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-800/50 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-white">PT Mandiri Teknologi</div>
                    <div className="text-[10px] text-neutral-600 mt-0.5">$24K ARR · Renewal Mar 2026</div>
                  </div>
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-950 border border-orange-900/50 px-2 py-1 rounded-md">HIGH</span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  {["Competitor evaluation (Qontak)", "Feature gap flagged", "Budget pressure Q2", "3-day silence"].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-2 text-[11px] text-red-400">
                      <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />{s}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step >= 2 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-neutral-900 border border-neutral-800/50 rounded-xl flex flex-col overflow-hidden">
                <div className="px-4 py-2.5 border-b border-neutral-800/50 flex items-center gap-2 flex-shrink-0">
                  <Icon name="draft" size={12} color="#525252" />
                  <span className="text-[11px] text-neutral-600 font-medium">Draft · your voice</span>
                </div>
                <div className="flex-1 px-4 py-3 overflow-hidden">
                  <p className="text-[12px] text-neutral-300 leading-relaxed">
                    Halo Pak Budi, terima kasih sudah share feedback-nya. Soal fitur export, tim kami sudah prioritaskan untuk sprint bulan depan. Untuk budget Q2, ada opsi yang bisa kita sesuaikan — boleh jadwalkan 15 menit minggu ini?
                  </p>
                </div>
                <div className="px-4 py-3 border-t border-neutral-800/50 flex gap-2 flex-shrink-0">
                  <button className="flex-1 text-[12px] text-neutral-600 border border-neutral-800 rounded-lg py-2 hover:border-neutral-700 transition-colors">Edit</button>
                  <motion.button
                    onClick={advance} disabled={loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex-1 text-[12px] font-semibold text-black rounded-lg py-2 flex items-center justify-center gap-1.5"
                    style={{ background: loading ? "#a3a3a3" : ORANGE }}
                  >
                    {loading
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full" />
                      : <><Icon name="send" size={11} color="black" /> Approve</>
                    }
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="border border-emerald-900/50 rounded-xl px-4 py-4 flex flex-col gap-1.5" style={{ background: "#052e16" }}>
                <div className="flex items-center gap-2">
                  <Icon name="check2" size={15} color={WA_GREEN} />
                  <span className="text-[13px] font-semibold text-emerald-300">Delivered on WhatsApp</span>
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span className="text-emerald-800">Signal resolved · Health updated</span>
                  <span className="font-bold" style={{ color: ORANGE }}>$16K ARR protected</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-16 pb-8 flex items-center justify-between flex-shrink-0">
        <p className="text-[12px] text-neutral-700 max-w-lg">
          {step === 3
            ? "CS lead approved one message. Account saved. Took 8 seconds."
            : DEMO_STEPS[step].hint
          }
        </p>
        {step !== 2 && (
          <motion.button onClick={advance} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 text-[13px] font-medium px-5 py-2.5 rounded-xl border transition-all"
            style={step === 3
              ? { background: ORANGE + "15", borderColor: ORANGE + "40", color: ORANGE }
              : { background: "#141414", borderColor: "#2a2a2a", color: "#737373" }
            }>
            {step === 3 ? "Continue →" : <>Next <Icon name="chevr" size={13} color="currentColor" /></>}
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
      <div className="flex-1 flex flex-col justify-center p-16 gap-10">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: ORANGE }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ORANGE }} />
            Product
          </p>
          <h2 className="text-[46px] font-light leading-[1.08] tracking-[-0.028em] text-white">
            Built for the Head of CS.<br />
            <span className="text-neutral-500">Not the analyst.</span>
          </h2>
        </div>
        <p className="text-[15px] text-neutral-500 leading-relaxed max-w-sm">
          The CS lead sees a queue of accounts that need attention today. One tap to approve the draft. Message reaches the customer. Nothing else to do.
        </p>
        <div className="flex flex-col gap-4 max-w-sm">
          {[
            { icon: "scan",    t: "Signal detection — Bahasa Indonesia, Malay, English" },
            { icon: "draft",   t: "Draft generation in your team's voice" },
            { icon: "send",    t: "One-tap delivery directly to WhatsApp" },
            { icon: "chart",   t: "ARR tracking — automated weekly leadership digest" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-neutral-600 flex-shrink-0"><Icon name={f.icon} size={16} /></div>
              <span className="text-[13px] text-neutral-400">{f.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[380px] flex items-center justify-center bg-[#0a0a0a] border-l border-neutral-800/50 p-12 flex-shrink-0">
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full bg-white rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
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
              <span className="ml-auto text-[10px] bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded text-orange-700">Qontak</span>
            </div>
            <p className="text-[13px] text-neutral-800 leading-relaxed">&ldquo;Kita lagi coba Qontak juga bulan ini...&rdquo;</p>
          </div>
          <div className="px-5 py-3.5 flex items-center gap-2.5">
            <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-[9px] font-bold text-neutral-400 flex-shrink-0">AI</span>
            <span className="text-[12px] text-neutral-500">Draft retention message — save $16K</span>
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
    <div className="flex h-full flex-col justify-center p-16 gap-10">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: ORANGE }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ORANGE }} />
          Market &amp; Competition
        </p>
        <h2 className="text-[48px] font-light leading-[1.08] tracking-[-0.028em] text-white">
          A $8.6B market.<br />
          <span className="text-neutral-500">No purpose-built solution.</span>
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-1 flex flex-col gap-4">
          <div className="flex-1 rounded-2xl p-7 border" style={{ background: ORANGE + "08", borderColor: ORANGE + "35" }}>
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase mb-3" style={{ color: ORANGE }}>Beachhead</p>
            <div className="text-[52px] font-light tracking-[-0.05em] leading-none mb-2" style={{ color: ORANGE }}>~400</div>
            <p className="text-[12px] text-neutral-500 leading-relaxed">B2B SaaS in ID + MY with $1M–$20M ARR and a dedicated CS function</p>
          </div>
          <div className="flex-1 bg-[#0a0a0a] rounded-2xl p-7 border border-neutral-800/50">
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-600 mb-3">SEA Market by 2029</p>
            <div className="text-[52px] font-light text-white tracking-[-0.05em] leading-none mb-2">$8.6B</div>
            <p className="text-[12px] text-neutral-500 leading-relaxed">22% CAGR from $3.2B (2024) — CS tooling is a decade behind</p>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-3">
          <div className="grid grid-cols-5 gap-2 px-4 pb-3 border-b border-neutral-800/50">
            <div className="col-span-1" />
            {["WhatsApp", "SEA Pricing", "Auto-Draft", "Direct Send"].map(h => (
              <div key={h} className="text-[10px] font-semibold text-neutral-700 text-center tracking-[0.1em] uppercase">{h}</div>
            ))}
          </div>
          {[
            { name: "Gainsight",     vals: [0, 0, .5, 0] },
            { name: "ChurnZero",     vals: [0, 0, .5, 0] },
            { name: "Vitally",       vals: [0, .5, .5, 0] },
            { name: "Intercom Fin",  vals: [.5, .5, 1, 0] },
            { name: "Agency (Kai)",  vals: [.5, .5, 1, 0] },
          ].map(row => (
            <div key={row.name} className="grid grid-cols-5 gap-2 px-4 py-2.5 rounded-xl border border-neutral-800/40">
              <div className="text-[13px] text-neutral-500 font-medium col-span-1">{row.name}</div>
              {row.vals.map((v, i) => (
                <div key={i} className="text-center text-[14px]">
                  {v === 1 ? <span className="text-emerald-500">✓</span> : v === .5 ? <span className="text-neutral-600">~</span> : <span className="text-neutral-800">—</span>}
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2 px-4 py-3 rounded-xl border" style={{ background: ORANGE + "0d", borderColor: ORANGE + "35" }}>
            <div className="text-[14px] font-bold text-white col-span-1">Nectic</div>
            {[1,1,1,1].map((_, i) => (
              <div key={i} className="text-center text-[14px] font-bold" style={{ color: ORANGE }}>✓</div>
            ))}
          </div>

          <div className="px-4 pt-1">
            <p className="text-[12px] text-neutral-700 leading-relaxed">
              The moat is the willingness to do the unsexy work — parsing messy exports, understanding Bahasa/Malay code-switching, delivering directly to WhatsApp — in a market too small to matter to San Francisco.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 8: BUSINESS MODEL ──────────────────────────────────────────────────
function S8BizModel() {
  return (
    <div className="flex h-full flex-col justify-center p-16 gap-10">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: ORANGE }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ORANGE }} />
          Business Model
        </p>
        <h2 className="text-[48px] font-light leading-[1.08] tracking-[-0.028em] text-white">
          Save one account.<br />
          <span className="text-neutral-500">Pay for the year.</span>
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="bg-[#0a0a0a] border border-neutral-800/50 rounded-2xl p-8 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-600 mb-3">Starter</p>
            <div className="text-[44px] font-light text-white tracking-[-0.04em] leading-none">$149<span className="text-[16px] text-neutral-600">/mo</span></div>
            <div className="text-[12px] text-neutral-700 mt-2">Up to 20 accounts</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {["WhatsApp analysis", "Signal detection", "Auto-draft responses", "Email re-alerts"].map(f => (
              <div key={f} className="flex items-center gap-2 text-[12px] text-neutral-500">
                <span className="text-emerald-500"><Icon name="check" size={12} /></span>{f}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-400">Growth</p>
              <span className="text-[9px] font-black bg-neutral-900 text-white px-2 py-0.5 rounded tracking-widest">RECOMMENDED</span>
            </div>
            <div className="text-[44px] font-light text-neutral-900 tracking-[-0.04em] leading-none">$299<span className="text-[16px] text-neutral-400">/mo</span></div>
            <div className="text-[12px] text-neutral-400 mt-2">Up to 100 accounts</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {["Everything in Starter", "Direct WhatsApp delivery", "ARR protection dashboard", "Weekly leadership digest", "Alert controls"].map(f => (
              <div key={f} className="flex items-center gap-2 text-[12px] text-neutral-600">
                <span className="text-emerald-500"><Icon name="check" size={12} /></span>{f}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-neutral-800/50 rounded-2xl p-8 flex flex-col gap-4 justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-600 mb-5">Unit Economics</p>
            <div className="flex flex-col gap-0">
              {[
                { l: "ACV (Growth)",    v: "$3,588",      hi: true  },
                { l: "10 pilots →",     v: "~$36K ARR",   hi: true  },
                { l: "Payback period",  v: "< 1 month"             },
                { l: "Expansion",       v: "More accounts"          },
                { l: "Roadmap",         v: "% of ARR saved"         },
              ].map(r => (
                <div key={r.l} className="flex justify-between items-baseline border-b border-neutral-800/60 py-2.5">
                  <span className="text-[11px] text-neutral-600">{r.l}</span>
                  <span className="text-[13px] font-semibold" style={{ color: r.hi ? ORANGE : "#525252" }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-neutral-700 leading-relaxed">
            A $24K ARR account saved covers the entire year. That&apos;s the ROI conversation with every CS lead.
          </p>
        </div>
      </div>

      <div className="rounded-xl border px-7 py-4" style={{ background: ORANGE + "07", borderColor: ORANGE + "22" }}>
        <p className="text-[13px] text-neutral-500 leading-relaxed">
          <span className="text-white font-medium">Roadmap: outcome-based pricing.</span>{" "}
          As we prove ARR protection at scale, the model shifts to a percentage of revenue saved — aligning Nectic&apos;s success entirely with the customer&apos;s retention outcome.
        </p>
      </div>
    </div>
  )
}

// ─── Registry ─────────────────────────────────────────────────────────────────
const SLIDES = [
  { label: "Cover",          component: S1Cover,    demo: false },
  { label: "Problem",        component: S2Problem,  demo: false },
  { label: "Why Now",        component: S3WhyNow,   demo: false },
  { label: "How It Works",   component: S4Loop,     demo: false },
  { label: "Demo",           component: null,       demo: true  },
  { label: "Product",        component: S6Product,  demo: false },
  { label: "Market",         component: S7Market,   demo: false },
  { label: "Business Model", component: S8BizModel, demo: false },
]

const variants = {
  enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function PitchDeck() {
  const [cur, setCur] = useState(0)
  const [dir, setDir] = useState(1)
  const [fs,  setFs]  = useState(false)

  const go = useCallback((n: number) => {
    if (n < 0 || n >= SLIDES.length) return
    setDir(n > cur ? 1 : -1)
    setCur(n)
  }, [cur])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(cur + 1) }
      if (e.key === "ArrowLeft")                   { e.preventDefault(); go(cur - 1) }
      if (e.key === "f" || e.key === "F")           toggle()
    }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [cur, go])

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}); setFs(true) }
    else { document.exitFullscreen().catch(() => {}); setFs(false) }
  }, [])

  useEffect(() => {
    const fn = () => setFs(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", fn)
    return () => document.removeEventListener("fullscreenchange", fn)
  }, [])

  const slide = SLIDES[cur]

  return (
    <div className="fixed inset-0 flex flex-col select-none" style={{ background: "#0d0d0d", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={cur} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 flex flex-col">
            {slide.demo
              ? <SDemoFlow onAdvanceSlide={() => go(cur + 1)} />
              : slide.component && <slide.component />
            }
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav bar */}
      <div className="h-11 border-t border-neutral-800/40 flex items-center justify-between px-8 flex-shrink-0" style={{ background: "#0d0d0d" }}>
        <div className="flex items-center gap-2">
          <Logo size={15} />
          <span className="text-[10px] font-semibold text-neutral-700 tracking-tight">Nectic</span>
        </div>

        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button key={i} onClick={() => go(i)} title={s.label} className="h-5 flex items-center px-0.5">
              <div className="h-1 rounded-full transition-all duration-300"
                style={{ width: i === cur ? 18 : 4, background: i === cur ? (s.demo ? WA_GREEN : ORANGE) : "#292929" }} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-neutral-700 tabular-nums">{cur + 1} / {SLIDES.length}</span>
          <button onClick={() => go(cur - 1)} disabled={cur === 0}
            className="w-6 h-6 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-700 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-default transition-all">
            <Icon name="chevl" size={11} />
          </button>
          <button onClick={() => go(cur + 1)} disabled={cur === SLIDES.length - 1}
            className="w-6 h-6 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-700 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-default transition-all">
            <Icon name="chevr" size={11} />
          </button>
          <button onClick={toggle} title="Fullscreen (F)"
            className="w-6 h-6 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-700 hover:text-white hover:border-neutral-600 transition-all">
            <Icon name={fs ? "minimize" : "maximize"} size={11} />
          </button>
        </div>
      </div>

      {cur === 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[9px] text-neutral-800 pointer-events-none tracking-[0.2em] uppercase">
          ← → to navigate · F for fullscreen
        </motion.p>
      )}
    </div>
  )
}
