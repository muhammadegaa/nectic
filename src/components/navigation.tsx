"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-lg text-foreground">Nectic</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-foreground/70 hover:text-foreground text-sm transition-colors">
              How it works
            </a>
            <a href="#features" className="text-foreground/70 hover:text-foreground text-sm transition-colors">
              Features
            </a>
            <a href="#security" className="text-foreground/70 hover:text-foreground text-sm transition-colors">
              Security
            </a>
            <a href="#contact" className="text-foreground/70 hover:text-foreground text-sm transition-colors">
              Contact
            </a>
          </div>

          <div className="hidden md:flex gap-3">
            <Button variant="outline" size="sm">
              Sign in
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Try Sandbox
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3 border-t border-border pt-4">
            <a href="#how-it-works" className="block text-foreground/70 hover:text-foreground text-sm py-2">
              How it works
            </a>
            <a href="#features" className="block text-foreground/70 hover:text-foreground text-sm py-2">
              Features
            </a>
            <a href="#security" className="block text-foreground/70 hover:text-foreground text-sm py-2">
              Security
            </a>
            <a href="#contact" className="block text-foreground/70 hover:text-foreground text-sm py-2">
              Contact
            </a>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                Sign in
              </Button>
              <Button size="sm" className="flex-1 bg-primary text-primary-foreground">
                Try Sandbox
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
