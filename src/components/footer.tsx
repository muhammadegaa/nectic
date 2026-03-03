"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-100 py-10 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/" className="text-sm font-medium text-neutral-900 hover:opacity-70 transition-opacity">
          Nectic
        </Link>

        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
            How it works
          </a>
          <a href="mailto:hello@nectic.com" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
            Contact
          </a>
          <span className="text-xs text-neutral-300">
            © {new Date().getFullYear()} Nectic
          </span>
        </div>
      </div>
    </footer>
  )
}
