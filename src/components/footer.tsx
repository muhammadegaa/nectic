"use client"

import Link from "next/link"
import LogoIcon from "@/components/logo-icon"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-100 py-10 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="text-sm font-medium text-neutral-900">Nectic</span>
            <span className="text-xs text-neutral-400 ml-1">— Account Health OS for WhatsApp-first B2B SaaS</span>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <a href="#how-it-works" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
              How it works
            </a>
            <Link href="/concept/login" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
              Sign in
            </Link>
            <a href="mailto:hello@nectic.com" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
              Contact
            </a>
            <Link href="/privacy" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
              Privacy
            </Link>
            <span className="text-xs text-neutral-300">
              © {new Date().getFullYear()} Nectic
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
