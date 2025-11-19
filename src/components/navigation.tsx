"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ease-out ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
          : "bg-background/0 backdrop-blur-0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-opacity duration-200 hover:opacity-80"
          >
            <img src="/logo.svg" alt="Nectic" className="w-8 h-8 transition-transform duration-200 group-hover:scale-105" />
            <span className="text-xl font-medium text-foreground tracking-tight">Nectic</span>
          </Link>

          {/* Desktop Menu - Minimal */}
          <div className="hidden lg:flex items-center gap-8">
            <a
              href="#how-to"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors duration-200 relative group"
            >
              How to
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#use-cases"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors duration-200 relative group"
            >
              Use Cases
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#security"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors duration-200 relative group"
            >
              Security
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground transition-all duration-200 group-hover:w-full" />
            </a>
            <Button
              size="sm"
              className="group bg-foreground text-background hover:bg-foreground/90 h-9 px-4 text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Talk to us
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg transition-colors duration-200 hover:bg-muted/50"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-foreground transition-transform duration-200" />
            ) : (
              <Menu className="w-5 h-5 text-foreground transition-transform duration-200" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden pb-6 space-y-4 border-t border-border/50 pt-4 animate-fade-in">
            <a
              href="#how-to"
              onClick={() => setIsOpen(false)}
              className="block text-sm text-foreground/60 hover:text-foreground transition-colors duration-200"
            >
              How to
            </a>
            <a
              href="#use-cases"
              onClick={() => setIsOpen(false)}
              className="block text-sm text-foreground/60 hover:text-foreground transition-colors duration-200"
            >
              Use Cases
            </a>
            <a
              href="#security"
              onClick={() => setIsOpen(false)}
              className="block text-sm text-foreground/60 hover:text-foreground transition-colors duration-200"
            >
              Security
            </a>
            <Button
              size="sm"
              className="w-full justify-center group bg-foreground text-background hover:bg-foreground/90"
            >
              Talk to us
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
