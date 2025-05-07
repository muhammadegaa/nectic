import type React from "react"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Allow the dashboard/page.tsx to handle the redirect
  return <>{children}</>
}
