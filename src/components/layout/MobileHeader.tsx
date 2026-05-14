'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkspaceStore } from '@/store/workspace'
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
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspaceStore()
  const { t, lang } = useTranslation()
  const active = activeWorkspace()

  const wsIcon = mounted && active ? WORKSPACE_TYPE_ICONS[active.type] : '📁'
  const wsName = mounted && active ? active.name : (lang === 'es' ? 'Espacio' : 'Workspace')
  const { openHelp } = useHelpStore()

  return (
    <header className="flex md:hidden items-center justify-between gap-3 px-4 h-16 border-b border-border bg-background sticky top-0 z-50 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 bg-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <span className="font-bold text-base tracking-tight text-foreground">Nova</span>
      </div>

      {/* Help button */}
      <div className="flex-1" />
      <button
        onClick={() => openHelp()}
        className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all mr-1"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* Workspace dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-sm font-semibold text-foreground hover:bg-accent transition-all outline-none min-w-0 active:scale-95">
          <span>{wsIcon}</span>
          <span className="truncate max-w-[100px]">{wsName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border mt-2">
          <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 mb-1">
            {t('nav').switch_workspace}
          </div>
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => { setActiveWorkspaceId(ws.id); router.refresh() }}
              className={cn(
                "rounded-xl px-3 py-2 cursor-pointer",
                ws.id === activeWorkspaceId ? 'bg-accent text-accent-foreground' : 'focus:bg-accent'
              )}
            >
              <span className="mr-3 text-lg">{WORKSPACE_TYPE_ICONS[ws.type]}</span>
              <span className="font-semibold">{ws.name}</span>
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
    </header>
  )
}
