"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

const ORANGE = "#F5A623"

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M50 6 C26 28 20 46 20 64 A30 30 0 0 0 80 64 C80 46 74 28 50 6 Z"
        stroke={ORANGE}
        strokeWidth="5.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// ─── Slide components ───────────────────────────────────────────────────────

function S1Cover() {
  return (
    <div className="flex h-full">
      {/* Left */}
      <div className="flex flex-col justify-between p-16 flex-1">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <span className="text-white text-lg font-semibold tracking-tight">Nectic</span>
        </div>

        <div>
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-neutral-500 mb-8">
            Antler Indonesia · March 2026
          </p>
          <h1 className="text-[62px] font-light leading-[1.05] tracking-[-0.03em] text-white mb-8">
            Every at-risk account.<br />
            <span className="text-neutral-500">Caught before</span><br />
            <span className="text-neutral-500">it costs you.</span>
          </h1>
          <p className="text-base text-neutral-500 max-w-md leading-relaxed">
            AI-native churn prevention system for WhatsApp-first B2B SaaS in Southeast Asia.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-light text-white tabular-nums">91%</div>
            <div className="text-xs text-neutral-600 mt-1">B2B convos in Indonesia<br />happen on WhatsApp</div>
          </div>
          <div className="w-px h-10 bg-neutral-800" />
          <div>
            <div className="text-2xl font-light text-white tabular-nums">30+ days</div>
            <div className="text-xs text-neutral-600 mt-1">earlier signal detection<br />vs manual triage</div>
          </div>
          <div className="w-px h-10 bg-neutral-800" />
          <div>
            <div className="text-2xl font-light text-white tabular-nums">68%</div>
            <div className="text-xs text-neutral-600 mt-1">of churned customers had<br />signals weeks before leaving</div>
          </div>
        </div>
      </div>

      {/* Right — dark panel */}
      <div className="w-[340px] bg-neutral-950 border-l border-neutral-800 flex flex-col justify-center p-12 gap-8">
        {[
          { icon: "💬", label: "WhatsApp signals detected" },
          { icon: "✍️", label: "Response drafted automatically" },
          { icon: "📱", label: "Sent via WATI in one tap" },
          { icon: "✅", label: "ARR protected — logged" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-base flex-shrink-0">
              {item.icon}
            </div>
            <span className="text-sm text-neutral-400">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function S2Problem() {
  return (
    <div className="flex h-full flex-col p-16 gap-10">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase mb-4" style={{ color: ORANGE }}>
          The Problem
        </p>
        <h2 className="text-[44px] font-light leading-[1.1] tracking-[-0.025em] text-white">
          CS teams are flying blind.<br />
          <span className="text-neutral-500">Churn signals live in WhatsApp. Nobody's watching.</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Without */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 flex flex-col gap-5">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-600">Without Nectic</p>
          {[
            "CS manager spends 2–3 hrs reading WhatsApp manually. Every single day.",
            "Churn signal fires Friday evening. Team sees it Tuesday. Account already cold.",
            "Risk discovered 3 weeks late — when CS escalates it in a Slack message.",
            "Gainsight: $40K+/yr. No WhatsApp. Built for Salesforce orgs in San Francisco.",
          ].map((t, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-4 h-4 rounded-full bg-red-950 border border-red-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">{t}</p>
            </div>
          ))}
        </div>

        {/* With */}
        <div className="bg-white/[0.03] border border-neutral-700/50 rounded-2xl p-8 flex flex-col gap-5">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-600">With Nectic</p>
          {[
            "Agent scans every account overnight. Queue shows only what needs action today.",
            "Signal detected the moment it appears. Draft response already waiting.",
            "Unactioned critical signal after 3 days? Re-alert fires automatically.",
            "Monday ARR digest delivered. Revenue saved, accounts protected — no manual work.",
          ].map((t, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-l-2 pl-5 text-sm text-neutral-500 leading-relaxed" style={{ borderColor: ORANGE }}>
        If Nectic disappears tomorrow, your CS team reverts to manual WhatsApp triage. Accounts slip. Churn happens two weeks later.{" "}
        <span className="text-neutral-300 font-medium">That's the test of whether something is mission-critical.</span>
      </div>
    </div>
  )
}

function S3WhyNow() {
  return (
    <div className="flex h-full flex-col p-16 gap-12">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase mb-4" style={{ color: ORANGE }}>
          Why Now
        </p>
        <h2 className="text-[44px] font-light leading-[1.1] tracking-[-0.025em] text-white">
          WhatsApp is the OS for B2B in SEA.<br />
          <span className="text-neutral-500">AI can finally read it.</span>
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { num: "2B+", label: "WhatsApp active users globally. SEA has the highest B2B adoption rate of any region." },
          { num: "$1B+", label: "Messages processed monthly by WATI BSP for B2B teams in SEA. Infrastructure already exists." },
          { num: "0", label: "Funded CS tools combining WhatsApp signal analysis + proactive WATI send for B2B SaaS in SEA." },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
            className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8"
          >
            <div className="text-[52px] font-light tracking-[-0.05em] mb-4 leading-none" style={{ color: s.num === "0" ? ORANGE : "white" }}>
              {s.num}
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
          <div className="text-sm font-medium text-white mb-2">LLMs now parse unstructured chat</div>
          <div className="text-sm text-neutral-500 leading-relaxed">Nectic extracts churn signals from WhatsApp exports in Bahasa Indonesia, Malay, and English — including code-switching. This capability didn't exist 18 months ago.</div>
        </div>
        <div className="border rounded-xl p-6" style={{ borderColor: ORANGE + "40", background: ORANGE + "08" }}>
          <div className="text-sm font-medium text-white mb-2">The window is 12–18 months</div>
          <div className="text-sm text-neutral-500 leading-relaxed">Agency (Kai) is the closest threat — well-funded, AI-native, moving toward WhatsApp. First-mover advantage closes fast. 10 pilots in 90 days is the target.</div>
        </div>
      </div>
    </div>
  )
}

function S4Loop() {
  return (
    <div className="flex h-full flex-col p-16 gap-10">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase mb-4" style={{ color: ORANGE }}>
          The Solution
        </p>
        <h2 className="text-[44px] font-light leading-[1.1] tracking-[-0.025em] text-white">
          One closed loop. <span className="text-neutral-500">Zero manual review.</span>
        </h2>
      </div>

      <div className="flex gap-3 flex-1">
        {[
          { n: "01", icon: "📤", title: "Upload", body: "CS lead exports WhatsApp conversation. Drags into Nectic. Any size, any date range, any language." },
          { n: "02", icon: "🔍", title: "Detect", body: "AI reads every message. Surfaces risk signals, sentiment decay, competitor mentions, silence patterns." },
          { n: "03", icon: "✍️", title: "Draft", body: "Response drafted in your team's actual voice. Evidence-backed. Queued for one-tap approval." },
          { n: "04", icon: "📱", title: "Send", body: "Approved draft sent via WATI directly on WhatsApp. From the account manager's number." },
          { n: "→", icon: "✅", title: "Protect", body: "Signal resolved. Health updated. ARR protected — logged in weekly leadership digest.", dark: true },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.45 }}
            className={`flex-1 rounded-2xl p-6 flex flex-col gap-4 border ${
              step.dark
                ? "bg-white text-neutral-900 border-white/20"
                : "bg-neutral-950 border-neutral-800"
            }`}
          >
            <div className={`text-xs font-semibold tracking-[0.12em] ${step.dark ? "text-neutral-400" : "text-neutral-600"}`}>
              {step.n}
            </div>
            <div className="text-2xl">{step.icon}</div>
            <div className={`text-base font-semibold ${step.dark ? "text-neutral-900" : "text-white"}`}>
              {step.title}
            </div>
            <div className={`text-sm leading-relaxed ${step.dark ? "text-neutral-500" : "text-neutral-500"}`}>
              {step.body}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border p-5 flex items-center gap-5" style={{ background: ORANGE + "0a", borderColor: ORANGE + "30" }}>
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase whitespace-nowrap" style={{ color: ORANGE }}>
          The outcome
        </div>
        <div className="w-px h-6 bg-neutral-800" />
        <p className="text-sm leading-relaxed" style={{ color: ORANGE + "cc" }}>
          Nectic is not a dashboard. It is an <strong style={{ color: ORANGE }}>AI-native workflow engine</strong> that runs churn prevention end-to-end — from the first WhatsApp signal to the sent response to the ARR impact tracked — without your CS team having to remember to check it.
        </p>
      </div>
    </div>
  )
}

function S5Product() {
  return (
    <div className="flex h-full gap-0">
      {/* Left — copy */}
      <div className="flex-1 flex flex-col justify-center p-16 gap-8">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] uppercase mb-4" style={{ color: ORANGE }}>
            Product
          </p>
          <h2 className="text-[42px] font-light leading-[1.1] tracking-[-0.025em] text-white mb-6">
            Built for the<br />Head of CS.<br />
            <span className="text-neutral-500">Not the analyst.</span>
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
            Upload a WhatsApp export. In 60 seconds, Nectic tells you which account is at risk, quotes the exact message that triggered it, and drafts the response.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { icon: "🧠", t: "Signal detection in Bahasa & Malay" },
            { icon: "✍️", t: "Human-voice draft generation" },
            { icon: "📱", t: "One-tap WATI WhatsApp send" },
            { icon: "📊", t: "ARR protection tracking" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-base">{f.icon}</span>
              <span className="text-sm text-neutral-400">{f.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — product card */}
      <div className="w-[400px] flex items-center justify-center bg-neutral-950 border-l border-neutral-800 p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">PT Mandiri Teknologi</p>
              <p className="text-xs text-neutral-400 mt-0.5">Growth · $24K ARR · Renewal Mar 2026</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-md shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              HIGH
            </span>
          </div>

          {/* ARR */}
          <div className="px-5 py-4 border-b border-neutral-100">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-light text-red-500 tabular-nums">$16K</span>
              <span className="text-sm text-neutral-400">ARR at risk</span>
              <span className="ml-auto text-xs text-red-400 font-medium">health 4/10</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full w-[40%] bg-orange-400 rounded-full" />
            </div>
          </div>

          {/* Signal */}
          <div className="bg-orange-50 border-b border-orange-100 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <span className="text-xs font-semibold text-orange-700">Competitor mentioned</span>
              <span className="ml-auto text-xs text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded">Qontak</span>
            </div>
            <p className="text-sm text-neutral-800 leading-relaxed">
              &ldquo;Kita lagi coba Qontak juga bulan ini, nanti kita compare hasilnya...&rdquo;
            </p>
          </div>

          {/* Action */}
          <div className="px-5 py-3.5 flex items-center gap-2.5">
            <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 text-[10px] font-bold shrink-0">AI</span>
            <span className="text-xs text-neutral-500">Draft retention offer — save $16K ARR</span>
            <span className="ml-auto text-xs font-semibold" style={{ color: ORANGE }}>Send →</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function S6Market() {
  return (
    <div className="flex h-full flex-col p-16 gap-10">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase mb-4" style={{ color: ORANGE }}>
          Market &amp; Competition
        </p>
        <h2 className="text-[44px] font-light leading-[1.1] tracking-[-0.025em] text-white">
          A clear gap. <span className="text-neutral-500">A 12-month window to own it.</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8 flex-1">
        {/* Market sizing */}
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 rounded-2xl p-8 border"
            style={{ background: ORANGE + "08", borderColor: ORANGE + "40" }}
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-3" style={{ color: ORANGE }}>Beachhead · ID + MY</p>
            <div className="text-[52px] font-light tracking-[-0.05em] mb-3" style={{ color: ORANGE }}>~400</div>
            <p className="text-sm text-neutral-500 leading-relaxed">B2B SaaS companies with $1M–$20M ARR and a dedicated CS function. WhatsApp-first. Underserved by every existing tool.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 bg-neutral-950 rounded-2xl p-8 border border-neutral-800"
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600 mb-3">Serviceable · SEA-6</p>
            <div className="text-[52px] font-light text-white tracking-[-0.05em] mb-3">~3K</div>
            <p className="text-sm text-neutral-500 leading-relaxed">B2B SaaS in Southeast Asia with $500K+ ARR and a CS workflow. Same WhatsApp-first pattern across the region.</p>
          </motion.div>
        </div>

        {/* Competition */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-5 gap-2 px-2 pb-2 border-b border-neutral-800">
            <div className="col-span-1" />
            {["WhatsApp", "SEA Price", "Auto-Draft", "WATI"].map(h => (
              <div key={h} className="text-[10px] font-semibold text-neutral-600 text-center tracking-[0.1em] uppercase">{h}</div>
            ))}
          </div>
          {[
            { name: "Gainsight", vals: [false, false, "~", false] },
            { name: "ChurnZero", vals: [false, false, "~", false] },
            { name: "Vitally", vals: [false, "~", "~", false] },
            { name: "Intercom Fin", vals: ["~", "~", true, false] },
            { name: "Agency (Kai)", vals: ["~", "~", true, false] },
          ].map((row) => (
            <div key={row.name} className="grid grid-cols-5 gap-2 px-2 py-2 rounded-lg border border-neutral-900">
              <div className="text-sm text-neutral-500 font-medium">{row.name}</div>
              {row.vals.map((v, i) => (
                <div key={i} className="text-center text-sm">
                  {v === true ? <span className="text-emerald-500">✓</span> : v === "~" ? <span className="text-yellow-600">~</span> : <span className="text-neutral-800">—</span>}
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2 px-2 py-3 rounded-xl border" style={{ background: ORANGE + "10", borderColor: ORANGE + "40" }}>
            <div className="text-sm font-bold text-white">Nectic</div>
            {[true, true, true, true].map((_, i) => (
              <div key={i} className="text-center text-sm font-semibold" style={{ color: ORANGE }}>✓</div>
            ))}
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed mt-2 pl-1">
            Our moat is the willingness to do the unsexy work — parsing messy exports, handling Bahasa/Malay code-switching, integrating WATI BSP — in a market that looks too small from San Francisco.
          </p>
        </div>
      </div>
    </div>
  )
}

function S7BizModel() {
  return (
    <div className="flex h-full flex-col p-16 gap-10">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase mb-4" style={{ color: ORANGE }}>
          Business Model
        </p>
        <h2 className="text-[44px] font-light leading-[1.1] tracking-[-0.025em] text-white">
          SaaS today. <span className="text-neutral-500">Outcome-based as we scale.</span>
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1">
        {/* Starter */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600 mb-2">Starter</p>
            <div className="text-[44px] font-light text-white tracking-[-0.04em] leading-none">$149</div>
            <div className="text-sm text-neutral-600 mt-1">/ month · 20 accounts</div>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {["WhatsApp upload + AI analysis", "Signal detection + risk scoring", "Auto-drafted responses", "Email re-alerts"].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="text-emerald-500">✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Growth */}
        <div className="bg-white rounded-2xl p-8 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-400">Growth</p>
              <span className="text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded tracking-wider">RECOMMENDED</span>
            </div>
            <div className="text-[44px] font-light text-neutral-900 tracking-[-0.04em] leading-none">$299</div>
            <div className="text-sm text-neutral-400 mt-1">/ month · 100 accounts</div>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {["Everything in Starter", "One-tap WATI WhatsApp send", "ARR protection dashboard", "Weekly leadership digest", "Alert preference controls"].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-neutral-600">
                <span className="text-emerald-500">✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Unit economics */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 flex flex-col gap-4 justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600 mb-5">Unit Economics</p>
            <div className="flex flex-col gap-3">
              {[
                { l: "ACV (Growth)", v: "$3,588", hi: true },
                { l: "10 pilots ARR", v: "~$36K", hi: true },
                { l: "Payback period", v: "< 1 month" },
                { l: "Expansion", v: "More accounts/workspace" },
              ].map(r => (
                <div key={r.l} className="flex justify-between items-baseline border-b border-neutral-900 pb-2">
                  <span className="text-xs text-neutral-600">{r.l}</span>
                  <span className={`text-sm font-semibold ${r.hi ? "" : "text-neutral-400"}`} style={r.hi ? { color: ORANGE } : {}}>
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Saving one $24K ARR account pays for the tool for the full year.
            <span className="text-neutral-400 block mt-1">Roadmap: % of ARR protected (outcome-based).</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function S8Ask() {
  return (
    <div className="flex h-full flex-col p-16 gap-10">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase mb-4" style={{ color: ORANGE }}>
          The Ask
        </p>
        <h2 className="text-[44px] font-light leading-[1.1] tracking-[-0.025em] text-white">
          Join us to own churn prevention<br />
          <span className="text-neutral-500">for B2B SaaS in Southeast Asia.</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 flex flex-col gap-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600">What we have</p>
          <p className="text-white font-medium">Working product. End-to-end.</p>
          <p className="text-sm text-neutral-500 leading-relaxed">WhatsApp upload → AI detection → auto-draft → one-tap WATI send → ARR tracked. Full loop in 60 seconds. Live at nectic.app today.</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 flex flex-col gap-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600">What we need</p>
          <p className="text-white font-medium">Co-founder. CS / RevOps background.</p>
          <p className="text-sm text-neutral-500 leading-relaxed">Deep network among Heads of CS at ID/MY SaaS companies. Can unlock 10 paying pilots in 90 days from existing relationships.</p>
        </div>
        <div className="rounded-2xl p-8 flex flex-col gap-3 border" style={{ background: ORANGE + "08", borderColor: ORANGE + "30" }}>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: ORANGE }}>90-Day Target</p>
          <p className="text-white font-medium">10 paying pilots. 1 closed loop documented.</p>
          <p className="text-sm text-neutral-500 leading-relaxed">Signal detected → draft sent → ARR protected. One real example on record changes every investor conversation.</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 flex flex-col gap-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-600">Why Antler</p>
          <p className="text-white font-medium">The portfolio is the distribution channel.</p>
          <p className="text-sm text-neutral-500 leading-relaxed">B2B SaaS founders in Antler SEA are exactly the companies whose CS teams are our buyers. Warm intros that take months otherwise.</p>
        </div>
      </div>

      {/* Founder */}
      <div className="border border-neutral-800 rounded-xl p-5 flex items-center gap-5">
        <div className="w-11 h-11 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ color: ORANGE }}>
          M
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Muhammad Ega Simatupang</div>
          <div className="text-xs text-neutral-600 mt-0.5">Founder · Builder · nectic.app</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm font-medium" style={{ color: ORANGE }}>simatupang.ega@gmail.com</div>
          <div className="text-xs text-neutral-600 mt-0.5">nectic.app</div>
        </div>
      </div>
    </div>
  )
}

// ─── Slide registry ─────────────────────────────────────────────────────────

const SLIDES = [
  { id: 1, label: "Cover", component: S1Cover },
  { id: 2, label: "Problem", component: S2Problem },
  { id: 3, label: "Why Now", component: S3WhyNow },
  { id: 4, label: "Solution", component: S4Loop },
  { id: 5, label: "Product", component: S5Product },
  { id: 6, label: "Market", component: S6Market },
  { id: 7, label: "Business Model", component: S7BizModel },
  { id: 8, label: "The Ask", component: S8Ask },
]

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function PitchDeck() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const go = useCallback((next: number) => {
    if (next < 0 || next >= SLIDES.length) return
    setDirection(next > current ? 1 : -1)
    setCurrent(next)
  }, [current])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(current + 1)
      if (e.key === "ArrowLeft") go(current - 1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [current, go])

  const SlideComponent = SLIDES[current].component

  return (
    <div
      className="fixed inset-0 bg-[#0d0d0d] flex flex-col select-none"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}
    >
      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* Slide frame */}
            <div className="h-full mx-auto max-w-[1280px] flex flex-col">
              <SlideComponent />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation bar */}
      <div className="h-14 border-t border-neutral-800/60 flex items-center justify-between px-10 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Logo size={18} />
          <span className="text-xs font-semibold text-neutral-500 tracking-tight">Nectic</span>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="group flex items-center gap-0 h-8 px-1"
              title={s.label}
            >
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 6,
                  background: i === current ? ORANGE : "#404040",
                }}
              />
            </button>
          ))}
        </div>

        {/* Arrows + counter */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-700 tabular-nums">
            {current + 1} / {SLIDES.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => go(current - 1)}
              disabled={current === 0}
              className="w-8 h-8 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-default transition-all"
            >
              ←
            </button>
            <button
              onClick={() => go(current + 1)}
              disabled={current === SLIDES.length - 1}
              className="w-8 h-8 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-default transition-all"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hint — fades out */}
      {current === 0 && (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[11px] text-neutral-700 pointer-events-none"
        >
          Use ← → arrow keys or click to navigate
        </motion.div>
      )}
    </div>
  )
}
