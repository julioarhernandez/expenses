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
  const active = activeWorkspace()

  const wsIcon = mounted && active ? WORKSPACE_TYPE_ICONS[active.type] : '📁'
  const wsName = mounted && active ? active.name : 'Workspace'

  return (
    <header className="flex md:hidden items-center gap-3 px-4 h-14 border-b bg-background shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-white text-sm font-bold">N</div>
        <span className="font-semibold text-sm tracking-tight">Nova</span>
      </div>

      {/* Workspace dropdown — beside logo */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors outline-none min-w-0">
          <span>{wsIcon}</span>
          <span className="truncate max-w-32">{wsName}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => { setActiveWorkspaceId(ws.id); router.refresh() }}
              className={cn(ws.id === activeWorkspaceId && 'bg-accent')}
            >
              <span className="mr-2">{WORKSPACE_TYPE_ICONS[ws.type]}</span>
              {ws.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/settings?tab=workspaces')}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
