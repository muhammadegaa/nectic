"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/infrastructure/firebase/firebase-client"

export default function CtaSection() {
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
    <section id="early-access" className="py-24 px-6 lg:px-8 bg-neutral-900">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-6">
          Early access
        </p>

        <h2 className="text-3xl sm:text-4xl font-light text-white mb-4 max-w-lg leading-tight">
          Be among the first teams to try Nectic.
        </h2>

        <p className="text-neutral-400 text-base mb-10 max-w-md">
          We&apos;re working closely with a small group of B2B SaaS teams in Southeast Asia. Tell us about yourself and we&apos;ll be in touch.
        </p>

        {submitted ? (
          <div className="border border-neutral-700 px-6 py-5 max-w-sm">
            <p className="text-white text-sm font-medium mb-1">You&apos;re on the list.</p>
            <p className="text-neutral-400 text-sm">We&apos;ll reach out when your spot is ready.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-neutral-800 border border-neutral-700 text-white text-sm px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="bg-neutral-800 border border-neutral-700 text-white text-sm px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
              />
            </div>
            <input
              type="email"
              required
              placeholder="Work email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            />
            <div className="flex gap-3">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex-1 bg-neutral-800 border border-neutral-700 text-sm px-4 py-3 focus:outline-none focus:border-neutral-500 transition-colors text-neutral-400"
              >
                <option value="">Your role</option>
                <option value="PM">Product Manager</option>
                <option value="CS">Customer Success</option>
                <option value="Sales">Sales</option>
                <option value="Founder">Founder / CEO</option>
                <option value="Engineering">Engineering</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="bg-white text-neutral-900 text-sm font-medium px-6 py-3 hover:bg-neutral-200 transition-colors shrink-0 disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Request access"}
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </form>
        )}

        <p className="mt-6 text-xs text-neutral-600">
          B2B SaaS teams in SEA. WhatsApp Business account recommended.
        </p>
      </div>
    </section>
  )
}
