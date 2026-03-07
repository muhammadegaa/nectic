"use client"

import Link from "next/link"
import LogoIcon from "@/components/logo-icon"

interface ConceptNavProps {
  active: "accounts" | "board" | "workspace" | "outcomes"
  urgentCount?: number
  userLabel?: string
  saveStatus?: "idle" | "saving" | "saved"
  onSignOut?: () => void
  rightSlot?: React.ReactNode
}

export default function ConceptNav({
  active,
  urgentCount = 0,
  userLabel,
  saveStatus,
  onSignOut,
  rightSlot,
}: ConceptNavProps) {
  return (
    <>
      {/* Desktop / main nav */}
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-neutral-900">Nectic</span>
          </Link>
          <span className="text-neutral-200 hidden sm:inline">·</span>
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <Link
              href="/concept"
              className={
                active === "accounts"
                  ? "text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5"
                  : "text-neutral-400 hover:text-neutral-700 transition-colors"
              }
            >
              Accounts
            </Link>
            <Link
              href="/concept/board"
              className={`relative flex items-center gap-1.5 ${
                active === "board"
                  ? "text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5"
                  : "text-neutral-400 hover:text-neutral-700 transition-colors"
              }`}
            >
              Action queue
              {urgentCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-400 animate-ping opacity-75" />
                  <span className="relative">{urgentCount > 9 ? "9+" : urgentCount}</span>
                </span>
              )}
            </Link>
            <Link
              href="/concept/workspace"
              className={
                active === "workspace"
                  ? "text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5"
                  : "text-neutral-400 hover:text-neutral-700 transition-colors"
              }
            >
              Workspace
            </Link>
            <Link
              href="/concept/outcomes"
              className={
                active === "outcomes"
                  ? "text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5"
                  : "text-neutral-400 hover:text-neutral-700 transition-colors"
              }
            >
              Outcomes
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {saveStatus === "saving" && (
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <span className="w-3 h-3 border border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-600 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          )}
          {rightSlot}
          {(userLabel || onSignOut) && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 text-xs text-neutral-400">
              {userLabel && <span className="hidden sm:block">{userLabel}</span>}
              {onSignOut && (
                <button onClick={onSignOut} className="hover:text-neutral-700 transition-colors">
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10 flex">
        <Link
          href="/concept"
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${active === "accounts" ? "text-neutral-900" : "text-neutral-400"}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className={`text-[10px] ${active === "accounts" ? "font-semibold" : "font-medium"}`}>Accounts</span>
        </Link>
        <Link
          href="/concept/board"
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative ${active === "board" ? "text-neutral-900" : "text-neutral-400"}`}
        >
          {urgentCount > 0 && (
            <span className="absolute top-1.5 right-6 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {urgentCount > 9 ? "9+" : urgentCount}
            </span>
          )}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <span className={`text-[10px] ${active === "board" ? "font-semibold" : "font-medium"}`}>Queue</span>
        </Link>
        <Link
          href="/concept/workspace"
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${active === "workspace" ? "text-neutral-900" : "text-neutral-400"}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
          <span className={`text-[10px] ${active === "workspace" ? "font-semibold" : "font-medium"}`}>Workspace</span>
        </Link>
      </nav>
    </>
  )
}
