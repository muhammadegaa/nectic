"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/infrastructure/firebase/firebase-client"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

export default function CtaSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email) return
    setSubmitting(true)
    setError("")
    try {
      await addDoc(collection(db, "earlyAccess"), {
        ...form,
        submittedAt: serverTimestamp(),
        source: "landing-page",
      })
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="early-access" className="py-20 sm:py-28 px-6 lg:px-8 bg-neutral-900" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease }}
          >
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-5">
              Early access
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-white mb-5 leading-tight">
              Stop managing churn manually.
            </h2>
            <p className="text-neutral-400 text-base leading-relaxed mb-8">
              We are working with CS leads at B2B SaaS companies in Indonesia and Singapore
              whose customers live in WhatsApp. If your team is reading chats manually
              to figure out who&apos;s at risk — this is built for you.
            </p>

            <div className="space-y-3">
              {[
                "Connects to WhatsApp Business — no new tools for your team",
                "First account analysed in under 60 seconds",
                "Draft responses generated, ready to send with one click",
                "Email alert the moment a high-risk signal appears",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <p className="text-sm text-neutral-400">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12, ease }}
          >
            {submitted ? (
              <div className="border border-neutral-700 rounded-xl px-6 py-7">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-white text-sm font-medium">You are on the list.</p>
                </div>
                <p className="text-neutral-400 text-sm">
                  We will reach out within a few days to schedule a quick call.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-neutral-800 border border-neutral-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="bg-neutral-800 border border-neutral-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Work email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                />
                <div className="flex gap-3">
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="flex-1 bg-neutral-800 border border-neutral-700 text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-neutral-500 transition-colors text-neutral-400"
                  >
                    <option value="">Your role</option>
                    <option value="CS">Head of CS / CS Lead</option>
                    <option value="PM">Product Manager</option>
                    <option value="Founder">Founder / CEO</option>
                    <option value="Sales">Sales</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-white text-neutral-900 text-sm font-semibold px-6 py-3 rounded-lg hover:bg-neutral-100 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Request access"}
                  </button>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <p className="text-xs text-neutral-600 pt-1">
                  No spam. We will reach out within 2 business days.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
