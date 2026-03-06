"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md border-b border-neutral-100" : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={24} />
            <span className="text-base font-medium text-neutral-900 tracking-tight">Nectic</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              How it works
            </a>
            <Link href="/concept/login" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/concept/login"
              className="text-sm font-semibold text-white bg-neutral-900 px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Start for free →
            </Link>
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden pb-6 space-y-4 border-t border-neutral-100 pt-4">
            <a href="#how-it-works" onClick={() => setIsOpen(false)} className="block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              How it works
            </a>
            <Link href="/concept/login" onClick={() => setIsOpen(false)} className="block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/concept/login"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-semibold text-neutral-900"
            >
              Start for free →
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
