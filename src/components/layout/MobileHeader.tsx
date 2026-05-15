'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, Plus, HelpCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkspaceStore } from '@/store/workspace'
import { useExpenseStore } from '@/store/expenses'
import { useTranslation } from '@/hooks/useTranslation'
import { useHelpStore } from '@/store/help'

const WORKSPACE_TYPE_ICONS: Record<string, string> = {
  personal: '👤',
  business: '🏢',
  freelance: '💼',
  side_project: '🚀',
}

export function MobileHeader() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspaceStore()
  const { headerTitle, headerSubtitle } = useExpenseStore()
  const { t, lang } = useTranslation()
  const active = activeWorkspace()

  const wsIcon = mounted && active ? WORKSPACE_TYPE_ICONS[active.type] : '📁'
  const wsName = mounted && active ? active.name : (lang === 'es' ? 'Espacio' : 'Workspace')
  const wsInitial = mounted && active?.name ? active.name.charAt(0).toUpperCase() : 'W'
  const { openHelp } = useHelpStore()

  return (
    <header className="flex items-center justify-between gap-3 px-4 h-24 bg-background sticky top-0 z-50 shrink-0">
      {/* Title & Subtitle on the Left */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground truncate">{headerTitle}</h1>
          {pathname === '/settings' && (
             <button
                onClick={() => openHelp()}
                className="flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:text-[#6366F1] hover:bg-accent transition-all active:scale-95"
             >
                <HelpCircle className="h-5 w-5" />
             </button>
          )}
        </div>
        {headerSubtitle && (
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">
            {headerSubtitle}
          </p>
        )}
      </div>

      {/* Workspace switcher on the Right */}
      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="relative w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-base font-bold text-muted-foreground hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95 shadow-sm">
              {wsInitial}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background rounded-full border border-border flex items-center justify-center text-xs shadow-sm">
                {wsIcon}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border mt-2">
            <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 mb-1">
              {t('nav').switch_workspace}
            </div>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => {
                  setActiveWorkspaceId(ws.id)
                  if (pathname === '/dashboard') {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('workspaces', ws.id)
                    router.replace('/dashboard?' + params.toString())
                  } else {
                    router.refresh()
                  }
                }}
                className={cn(
                  "rounded-xl px-3 py-2 cursor-pointer flex items-center justify-between",
                  ws.id === activeWorkspaceId ? 'bg-accent text-accent-foreground' : 'focus:bg-accent'
                )}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg">{WORKSPACE_TYPE_ICONS[ws.type]}</span>
                  <span className="font-semibold">{ws.name}</span>
                </div>
                {ws.id === activeWorkspaceId && (
                  <Check className="h-4 w-4 text-[#6366F1]" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={() => router.push('/settings?tab=workspaces')} className="rounded-xl px-3 py-2 focus:bg-foreground focus:text-background cursor-pointer">
              <Plus className="mr-3 h-4 w-4" />
              <span className="font-semibold text-sm">
                {t('nav').new_workspace}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
