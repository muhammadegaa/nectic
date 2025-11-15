"use client"

import { Mail, Linkedin, Twitter } from "lucide-react"
import { useEffect, useState } from "react"

const footerLinks = [
  { label: "Documentation", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Security", href: "#" },
]

export default function Footer() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <footer className="bg-foreground text-background py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-1/2 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div
            className={`transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors duration-300">
                <span className="font-bold text-sm text-primary">N</span>
              </div>
              <span className="font-bold text-lg">Nectic</span>
            </div>
            <p className="text-background/60 text-sm">Enterprise AI assistants for your private data.</p>
          </div>

          {/* Product Links */}
          <div
            className={`transition-all duration-700 delay-100 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h3 className="font-semibold text-sm mb-4">Product</h3>
            <ul className="space-y-2">
              {["Features", "Pricing", "Security", "Roadmap"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-background/60 hover:text-background text-sm transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer Links */}
          <div
            className={`transition-all duration-700 delay-200 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h3 className="font-semibold text-sm mb-4">Developers</h3>
            <ul className="space-y-2">
              {["Documentation", "API Reference", "GitHub", "Examples"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-background/60 hover:text-background text-sm transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div
            className={`transition-all duration-700 delay-300 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h3 className="font-semibold text-sm mb-4">Connect</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-background/60 hover:text-background transition-all duration-300 hover:scale-110 inline-block"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-background/60 hover:text-background transition-all duration-300 hover:scale-110 inline-block"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-background/60 hover:text-background transition-all duration-300 hover:scale-110 inline-block"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-background/50 text-sm">
            <p>&copy; 2025 Nectic. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              {["Privacy", "Terms", "Cookies"].map((link) => (
                <a key={link} href="#" className="hover:text-background transition-colors duration-300">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
