'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DashboardLayoutContentProps {
  header: React.ReactNode
  children: React.ReactNode
}

export function DashboardLayoutContent({ header, children }: DashboardLayoutContentProps) {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      {/* Global Hero Background (only on Dashboard) */}
      {isDashboard && (
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-950 -z-0 transition-all duration-500" />
      )}

      <div className={cn(
        "relative z-10 transition-all duration-500",
        isDashboard ? "bg-transparent" : "bg-background shadow-sm border-b border-border/50"
      )}>
        {header}
      </div>
      <main className={cn(
        "relative z-10 flex-1 overflow-y-auto pb-40 transition-colors duration-500",
        isDashboard ? "bg-transparent" : "bg-gradient-to-b from-muted to-muted/40"
      )}>
        {children}
      </main>
    </div>
  )
}
