"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"

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
          <Link href="/" className="text-base font-medium text-neutral-900 tracking-tight hover:opacity-70 transition-opacity">
            Nectic
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              How it works
            </a>
            <a
              href="#early-access"
              className="text-sm font-medium text-neutral-900 border border-neutral-200 px-4 py-1.5 hover:bg-neutral-50 transition-colors"
            >
              Request access
            </a>
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
            <a href="#early-access" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-neutral-900">
              Request access
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}
