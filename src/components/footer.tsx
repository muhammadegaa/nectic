"use client"

import Link from "next/link"

const footerLinks = {
  product: [
    { label: "Upload", href: "/upload" },
    { label: "Sample demo", href: "/demo" },
    { label: "Security", href: "#security" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#contact" },
    { label: "Careers", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Trust Center", href: "#" },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border py-16 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 mb-4 group transition-opacity duration-200 hover:opacity-80"
            >
              <img
                src="/logo.svg"
                alt="Nectic"
                className="w-8 h-8 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-xl font-medium text-foreground">Nectic</span>
            </Link>
          </div>

          {/* Product */}
          <div>
            <div className="text-sm font-medium text-foreground mb-4">Product</div>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/50 hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-sm font-medium text-foreground mb-4">Company</div>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/50 hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-sm font-medium text-foreground mb-4">Legal</div>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/50 hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8">
          <div className="text-sm text-foreground/50">
            &copy; {new Date().getFullYear()} Nectic. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
