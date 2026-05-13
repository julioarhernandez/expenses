'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus } from 'lucide-react'
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

  return (
    <header className="flex md:hidden items-center justify-between gap-3 px-4 h-16 border-b border-slate-100 bg-white sticky top-0 z-50 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 bg-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <span className="font-bold text-base tracking-tight text-slate-900">Nova</span>
      </div>

      {/* Workspace dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all outline-none min-w-0 active:scale-95">
          <span>{wsIcon}</span>
          <span className="truncate max-w-[100px]">{wsName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100 mt-2">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
            {t('nav').switch_workspace}
          </div>
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => { setActiveWorkspaceId(ws.id); router.refresh() }}
              className={cn(
                "rounded-xl px-3 py-2 cursor-pointer",
                ws.id === activeWorkspaceId ? 'bg-indigo-50 text-indigo-600' : 'focus:bg-slate-50'
              )}
            >
              <span className="mr-3 text-lg">{WORKSPACE_TYPE_ICONS[ws.type]}</span>
              <span className="font-semibold">{ws.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-slate-50" />
          <DropdownMenuItem onClick={() => router.push('/settings?tab=workspaces')} className="rounded-xl px-3 py-2 focus:bg-slate-900 focus:text-white cursor-pointer">
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
