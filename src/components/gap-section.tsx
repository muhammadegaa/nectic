"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

const tiles = [
  {
    label: "Customer in WhatsApp",
    bg: "bg-neutral-900",
    labelColor: "text-neutral-500",
    quoteColor: "text-neutral-100",
    noteColor: "text-neutral-500",
    quote:
      '"Kak, sebenernya kami lagi evaluasi vendor lain juga sih... tapi nanti kita lihat hasilnya ya."',
    note: "Evaluating a competitor. Renewal in 6 weeks.",
  },
  {
    label: "What sales says in standup",
    bg: "bg-neutral-50",
    labelColor: "text-neutral-400",
    quoteColor: "text-neutral-600",
    noteColor: "text-neutral-400",
    quote: '"That account is doing fine. Renewal should be smooth this quarter."',
    note: null,
  },
  {
    label: "What PM learns",
    bg: "bg-amber-50",
    labelColor: "text-amber-500",
    quoteColor: "text-amber-900",
    noteColor: "text-amber-500",
    quote: '"No action needed. Prioritise the new feature roadmap."',
    note: null,
  },
]

export default function GapSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="py-20 sm:py-28 px-6 lg:px-8 bg-neutral-50" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease }}
          className="mb-10"
        >
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
            The gap
          </p>
          <h2 className="text-3xl font-light text-neutral-900 max-w-lg leading-tight">
            The same conversation.<br />Three very different stories.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-px bg-neutral-200 rounded-xl overflow-hidden">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.15 + i * 0.12, ease }}
              className={`${tile.bg} px-6 py-7`}
            >
              <p className={`text-xs font-medium uppercase tracking-widest mb-5 ${tile.labelColor}`}>
                {tile.label}
              </p>
              <p className={`text-sm leading-relaxed italic ${tile.quoteColor}`}>{tile.quote}</p>
              {tile.note && (
                <p className={`text-xs mt-4 ${tile.noteColor}`}>{tile.note}</p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.55, delay: 0.55 }}
          className="mt-6 text-sm text-neutral-500"
        >
          By the time churn is visible in your standup, the save window is closed.
        </motion.p>
      </div>
    </section>
  )
}
