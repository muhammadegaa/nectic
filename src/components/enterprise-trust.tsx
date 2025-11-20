"use client"

import type React from "react"
import { useEffect, useState } from "react"

export default function EnterpriseTrust() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="security" className="py-32 px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div
          className={`transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-sm text-foreground/50 mb-4">How We Ensure Zero Data Leakage</div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { 
                title: "Your Infrastructure", 
                description: "Data stays in your Firebase. We never store your sensitive information. Complete control over your data." 
              },
              { 
                title: "No Training Data", 
                description: "OpenAI API calls include privacy controls. Your data is never used for model training or stored by third parties." 
              },
              { 
                title: "User Isolation", 
                description: "Server-side authentication and Firestore security rules ensure users can only access their own data. Zero cross-contamination." 
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`group transition-all duration-700 ease-out ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-2xl font-light text-foreground mb-2 transition-colors duration-200 group-hover:text-foreground/90">
                  {item.title}
                </div>
                <div className="text-sm text-foreground/50 leading-relaxed transition-colors duration-200 group-hover:text-foreground/60">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-foreground/50 mb-8">Security Features</div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Server-Side Processing", description: "All database queries happen server-side. No client-side data access." },
              { title: "Token Verification", description: "Every API request verified with Firebase Auth. No spoofing possible." },
              { title: "Firestore Rules", description: "Database-level security rules enforce user isolation and access control." },
            ].map((item, index) => (
              <div
                key={index}
                className={`group transition-all duration-700 ease-out ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${(index + 3) * 100}ms` }}
              >
                <div className="text-2xl font-light text-foreground mb-2 transition-colors duration-200 group-hover:text-foreground/90">
                  {item.title}
                </div>
                <div className="text-sm text-foreground/50 transition-colors duration-200 group-hover:text-foreground/60">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
