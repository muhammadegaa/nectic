"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

const ORANGE = "#F5A623"

// ─── Logo ────────────────────────────────────────────────────────────────────
function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 6 C26 28 20 46 20 64 A30 30 0 0 0 80 64 C80 46 74 28 50 6 Z"
        stroke={ORANGE} strokeWidth="5.5" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// ─── Icons (clean SVG, no emoji) ─────────────────────────────────────────────
function Icon({ name, size = 20, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const s = size
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }

  const paths: Record<string, React.ReactNode> = {
    upload:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    scan:     <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>,
    draft:    <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    send:     <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    shield:   <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
    warning:  <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    tool:     <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    message:  <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    chart:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    check:    <><polyline points="20 6 9 17 4 12"/></>,
    globe:    <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    arrow:    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    zap:      <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    target:   <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    maximize: <><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>,
    minimize: <><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></>,
  }

  return <svg {...props}>{paths[name]}</svg>
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-5 flex items-center gap-2" style={{ color: ORANGE }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ORANGE }} />
      {children}
    </p>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[42px] font-light leading-[1.1] tracking-[-0.025em] text-white mb-0">
      {children}
    </h2>
  )
}

// ─── SLIDE 1: COVER ──────────────────────────────────────────────────────────
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
            { n: "3B+", l: "WhatsApp monthly\nactive users globally" },
            { n: "80%", l: "of businesses in ID/MY use\nWhatsApp for customer comms" },
            { n: "0", l: "CS tools built for\nWhatsApp-first teams in SEA" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-6">
              {i > 0 && <div className="w-px h-10 bg-neutral-800 mt-1" />}
              <div>
                <div className="text-2xl font-light text-white tabular-nums">{s.n}</div>
                <div className="text-xs text-neutral-600 mt-1 whitespace-pre-line leading-relaxed">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[320px] bg-[#0a0a0a] border-l border-neutral-800/60 flex flex-col justify-center p-12 gap-7 flex-shrink-0">
        {[
          { icon: "message", label: "WhatsApp signals detected automatically" },
          { icon: "scan",    label: "At-risk accounts surfaced in 60 seconds" },
          { icon: "draft",   label: "Response drafted in your team's voice" },
          { icon: "send",    label: "Sent via WhatsApp Business API" },
          { icon: "shield",  label: "ARR protected — tracked and reported" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.45 }}
            className="flex items-center gap-4"
          >
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

// ─── SLIDE 2: PROBLEM ────────────────────────────────────────────────────────
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
            "ARR digest delivered every Monday. Revenue saved, accounts protected — no manual report.",
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

// ─── SLIDE 3: WHY NOW ────────────────────────────────────────────────────────
function S3WhyNow() {
  return (
    <div className="flex h-full flex-col p-16 gap-9">
      <div>
        <Eyebrow>Why Now</Eyebrow>
        <H2>WhatsApp is the OS for B2B in SEA.<br /><span className="text-neutral-500">AI can finally read it.</span></H2>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {[
          {
            num: "3B+",
            label: "WhatsApp monthly active users globally — the largest messaging platform on earth, and the default B2B channel in ID & MY.",
            src: "Meta, May 2025",
          },
          {
            num: "22%",
            label: "CAGR of SEA's B2B SaaS market through 2029, growing from $3.2B to $8.6B. CS tooling hasn't kept up.",
            src: "Industry analysis, 2024",
          },
          {
            num: "$50K",
            label: "Gainsight median annual contract (Vendr, 279 buyers). No WhatsApp support. No path to SEA mid-market.",
            src: "Vendr, 2024",
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.45 }}
            className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-7"
          >
            <div className="text-[48px] font-light tracking-[-0.05em] mb-4 leading-none" style={{ color: i === 2 ? "#ef4444" : "white" }}>
              {s.num}
            </div>
            <p className="text-[13px] text-neutral-500 leading-relaxed mb-3">{s.label}</p>
            <p className="text-[10px] text-neutral-700 font-medium tracking-[0.1em]">{s.src}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-xl p-6">
          <div className="text-[13px] font-semibold text-white mb-2">LLMs now parse unstructured chat reliably</div>
          <div className="text-[13px] text-neutral-500 leading-relaxed">
            Nectic extracts churn signals from raw WhatsApp exports in Bahasa Indonesia, Malay, and English — including code-switching. This capability reached production quality in 2024.
          </div>
        </div>
        <div className="rounded-xl p-6 border" style={{ background: ORANGE + "08", borderColor: ORANGE + "30" }}>
          <div className="text-[13px] font-semibold text-white mb-2">The competitive window is open — for now</div>
          <div className="text-[13px] text-neutral-500 leading-relaxed">
            Agency (Elias Torres, $20M Series A from Menlo Ventures + Sequoia) is the closest-funded threat. They&apos;re building toward WhatsApp. The first-mover window in SEA is 12–18 months.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 4: THE LOOP ───────────────────────────────────────────────────────
function S4Loop() {
  const steps = [
    { n: "01", icon: "upload", title: "Upload",  body: "CS lead exports WhatsApp conversation. Drags into Nectic. Any size, any date range." },
    { n: "02", icon: "scan",   title: "Detect",  body: "AI reads every message. Surfaces risk signals, sentiment decay, competitor mentions." },
    { n: "03", icon: "draft",  title: "Draft",   body: "Response generated in your team's actual voice. Evidence-backed. One-tap review." },
    { n: "04", icon: "send",   title: "Send",    body: "Approved draft sent via WhatsApp Business API from the account manager's number." },
    { n: "→",  icon: "shield", title: "Protect", body: "Signal resolved. Health updated. ARR protected — logged in weekly digest.", accent: true },
  ]
  return (
    <div className="flex h-full flex-col p-16 gap-9">
      <div>
        <Eyebrow>The Solution</Eyebrow>
        <H2>One closed loop. <span className="text-neutral-500">Zero manual review.</span></H2>
      </div>

      <div className="flex gap-3 flex-1">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.09, duration: 0.4 }}
            className={`flex-1 rounded-2xl p-6 flex flex-col gap-4 border ${
              step.accent
                ? "bg-white border-white/10"
                : "bg-[#0a0a0a] border-neutral-800/60"
            }`}
          >
            <div className={`text-[10px] font-bold tracking-[0.14em] ${step.accent ? "text-neutral-400" : "text-neutral-700"}`}>{step.n}</div>
            <div className={step.accent ? "text-neutral-500" : "text-neutral-600"}>
              <Icon name={step.icon} size={20} />
            </div>
            <div className={`text-[15px] font-semibold ${step.accent ? "text-neutral-900" : "text-white"}`}>{step.title}</div>
            <div className={`text-[12px] leading-relaxed ${step.accent ? "text-neutral-500" : "text-neutral-500"}`}>{step.body}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border px-6 py-4 flex items-center gap-5" style={{ background: ORANGE + "0a", borderColor: ORANGE + "25" }}>
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase whitespace-nowrap" style={{ color: ORANGE }}>Outcome</div>
        <div className="w-px h-5 bg-neutral-800" />
        <p className="text-[13px] leading-relaxed" style={{ color: ORANGE + "bb" }}>
          Not a dashboard. Not an analytics layer. An <span style={{ color: ORANGE }} className="font-semibold">AI-native workflow engine</span> that runs churn prevention end-to-end — from the first signal to the sent response to the ARR impact — without your CS team having to remember to check it.
        </p>
      </div>
    </div>
  )
}

// ─── SLIDE 5: PRODUCT ────────────────────────────────────────────────────────
function S5Product() {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col justify-center p-16 gap-9">
        <div>
          <Eyebrow>Product</Eyebrow>
          <H2>Built for the Head of CS.<br /><span className="text-neutral-500">Not the analyst.</span></H2>
        </div>
        <p className="text-[14px] text-neutral-500 leading-relaxed max-w-xs">
          Upload a WhatsApp export. In 60 seconds, Nectic surfaces which account is at risk, quotes the exact message that triggered it, and drafts the response.
        </p>
        <div className="flex flex-col gap-4">
          {[
            { icon: "scan",    t: "Signal detection in Bahasa Indonesia & Malay" },
            { icon: "draft",   t: "Human-voice draft generation" },
            { icon: "send",    t: "One-tap WhatsApp Business API send via WATI" },
            { icon: "chart",   t: "ARR protection tracking & weekly digest" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-neutral-600"><Icon name={f.icon} size={16} /></div>
              <span className="text-[13px] text-neutral-400">{f.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[380px] flex items-center justify-center bg-[#0a0a0a] border-l border-neutral-800/60 p-12 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full bg-white rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.4)]"
        >
          <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium text-neutral-900">PT Mandiri Teknologi</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Growth · $24K ARR · Renewal Mar 2026</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-md flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              HIGH
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
            <p className="text-[13px] text-neutral-800 leading-relaxed">
              &ldquo;Kita lagi coba Qontak juga bulan ini, nanti kita compare hasilnya...&rdquo;
            </p>
          </div>
          <div className="px-5 py-3.5 flex items-center gap-2.5">
            <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 text-[9px] font-bold flex-shrink-0">AI</span>
            <span className="text-[12px] text-neutral-500">Draft retention offer — save $16K ARR</span>
            <span className="ml-auto text-[12px] font-semibold" style={{ color: ORANGE }}>Send →</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ─── SLIDE 6: MARKET ─────────────────────────────────────────────────────────
function S6Market() {
  return (
    <div className="flex h-full flex-col p-16 gap-9">
      <div>
        <Eyebrow>Market &amp; Competition</Eyebrow>
        <H2>A clear gap. <span className="text-neutral-500">A 12-month window to own it.</span></H2>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="flex-1 rounded-2xl p-7 border" style={{ background: ORANGE + "08", borderColor: ORANGE + "35" }}
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-3" style={{ color: ORANGE }}>Beachhead · ID + MY</p>
            <div className="text-[48px] font-light tracking-[-0.05em] mb-3 leading-none" style={{ color: ORANGE }}>~400</div>
            <p className="text-[13px] text-neutral-500 leading-relaxed">B2B SaaS companies with $1M–$20M ARR and a dedicated CS function. WhatsApp-first. Underserved by every tool on the market.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="flex-1 bg-[#0a0a0a] rounded-2xl p-7 border border-neutral-800/60"
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600 mb-3">Serviceable Market · SEA</p>
            <div className="text-[48px] font-light text-white tracking-[-0.05em] mb-3 leading-none">$8.6B</div>
            <p className="text-[13px] text-neutral-500 leading-relaxed">SEA B2B SaaS market by 2029 (22% CAGR from $3.2B in 2024). CS tooling for SEA mid-market is a decade behind.</p>
          </motion.div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-5 gap-2 px-3 pb-3 border-b border-neutral-800/60">
            <div />
            {["WhatsApp", "SEA Pricing", "Auto-Draft", "WATI Send"].map(h => (
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
                  {v === true ? <span className="text-emerald-500">✓</span>
                   : v === "~" ? <span className="text-neutral-600">~</span>
                   : <span className="text-neutral-800">—</span>}
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
            The moat is the willingness to do the unsexy work — parsing messy exports, handling Bahasa/Malay code-switching, integrating WATI — in a market that looks too small from San Francisco.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 7: BUSINESS MODEL ──────────────────────────────────────────────────
function S7BizModel() {
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
          <div className="flex flex-col gap-2.5 mt-1">
            {["WhatsApp upload + AI analysis", "Signal detection + risk scoring", "Auto-drafted responses", "Email re-alerts"].map(f => (
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
          <div className="flex flex-col gap-2.5 mt-1">
            {["Everything in Starter", "One-tap WATI WhatsApp send", "ARR protection dashboard", "Weekly leadership digest", "Alert preferences"].map(f => (
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
                { l: "ACV (Growth)",    v: "$3,588",  hi: true  },
                { l: "10 pilots",       v: "~$36K ARR", hi: true  },
                { l: "Payback period",  v: "< 1 month"            },
                { l: "Expansion",       v: "Accounts/workspace"   },
                { l: "Roadmap",         v: "% of ARR protected"   },
              ].map(r => (
                <div key={r.l} className="flex justify-between items-baseline border-b border-neutral-800/60 py-2.5">
                  <span className="text-[11px] text-neutral-600">{r.l}</span>
                  <span className="text-[13px] font-semibold" style={{ color: r.hi ? ORANGE : "#737373" }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed mt-4">
            One saved $24K ARR account covers the full year subscription. That&apos;s the ROI conversation starter.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE 8: ASK ────────────────────────────────────────────────────────────
function S8Ask() {
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
          <p className="text-[13px] text-neutral-500 leading-relaxed">WhatsApp upload → AI detection → auto-draft → one-tap WATI send → ARR tracked. Full loop in 60 seconds. Live at nectic.vercel.app today.</p>
        </div>
        <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-2xl p-8 flex flex-col gap-3">
          <div className="text-neutral-700 mb-1"><Icon name="users" size={18} /></div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600">What we need</p>
          <p className="text-[14px] font-medium text-white leading-snug">Co-founder. CS / RevOps background.</p>
          <p className="text-[13px] text-neutral-500 leading-relaxed">Deep network among Heads of CS at B2B SaaS companies in ID or MY. Can unlock 10 paying pilots in 90 days from existing relationships.</p>
        </div>
        <div className="rounded-2xl p-8 flex flex-col gap-3 border" style={{ background: ORANGE + "08", borderColor: ORANGE + "30" }}>
          <div className="mb-1" style={{ color: ORANGE + "80" }}><Icon name="target" size={18} color={ORANGE} /></div>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: ORANGE }}>90-Day Target</p>
          <p className="text-[14px] font-medium text-white leading-snug">10 paying pilots. 1 closed loop documented.</p>
          <p className="text-[13px] text-neutral-500 leading-relaxed">Signal detected → draft sent → ARR protected. One real example on record changes every subsequent investor conversation.</p>
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

// ─── Slide registry ───────────────────────────────────────────────────────────
const SLIDES = [
  { id: 1, label: "Cover",           component: S1Cover    },
  { id: 2, label: "Problem",         component: S2Problem  },
  { id: 3, label: "Why Now",         component: S3WhyNow   },
  { id: 4, label: "Solution",        component: S4Loop     },
  { id: 5, label: "Product",         component: S5Product  },
  { id: 6, label: "Market",          component: S6Market   },
  { id: 7, label: "Business Model",  component: S7BizModel },
  { id: 8, label: "The Ask",         component: S8Ask      },
]

const variants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 56 : -56 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -56 : 56 }),
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function PitchDeck() {
  const [current,    setCurrent]    = useState(0)
  const [direction,  setDirection]  = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const go = useCallback((next: number) => {
    if (next < 0 || next >= SLIDES.length) return
    setDirection(next > current ? 1 : -1)
    setCurrent(next)
  }, [current])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(current + 1) }
      if (e.key === "ArrowLeft")                   { e.preventDefault(); go(current - 1) }
      if (e.key === "f" || e.key === "F")           toggleFullscreen()
      if (e.key === "Escape" && isFullscreen)       setIsFullscreen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [current, go, isFullscreen])

  // Fullscreen API
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

  const SlideComponent = SLIDES[current].component

  return (
    <div
      className="fixed inset-0 flex flex-col select-none"
      style={{ background: "#0d0d0d", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}
    >
      {/* Slide */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            <SlideComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav bar */}
      <div className="h-12 border-t border-neutral-800/50 flex items-center justify-between px-8 flex-shrink-0" style={{ background: "#0d0d0d" }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Logo size={16} />
          <span className="text-[11px] font-semibold text-neutral-600 tracking-tight">Nectic</span>
        </div>

        {/* Dot nav */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              title={s.label}
              className="h-6 flex items-center px-0.5"
            >
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 20 : 5,
                  background: i === current ? ORANGE : "#333",
                }}
              />
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-700 tabular-nums">{current + 1} / {SLIDES.length}</span>

          <button
            onClick={() => go(current - 1)}
            disabled={current === 0}
            className="w-7 h-7 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-600 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-default transition-all"
          >
            <Icon name="arrow" size={12} color="currentColor" />
          </button>
          <button
            onClick={() => go(current + 1)}
            disabled={current === SLIDES.length - 1}
            className="w-7 h-7 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-600 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-default transition-all"
            style={{ transform: "scaleX(1)" }}
          >
            <Icon name="arrow" size={12} color="currentColor" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            className="w-7 h-7 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-600 hover:text-white hover:border-neutral-600 transition-all"
          >
            <Icon name={isFullscreen ? "minimize" : "maximize"} size={12} />
          </button>
        </div>
      </div>

      {/* First-slide keyboard hint */}
      {current === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 text-[10px] text-neutral-800 pointer-events-none tracking-widest uppercase"
        >
          Arrow keys to navigate · F for fullscreen
        </motion.div>
      )}
    </div>
  )
}
