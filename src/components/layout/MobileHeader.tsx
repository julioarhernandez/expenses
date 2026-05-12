'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
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
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const router = useRouter()
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspaceStore()
  const active = activeWorkspace()

  const wsIcon = mounted && active ? WORKSPACE_TYPE_ICONS[active.type] : '📁'
  const wsName = mounted && active ? active.name : 'Expenses'

  return (
    <>
      <header className="flex md:hidden items-center gap-3 px-4 h-14 border-b bg-background shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-white text-sm font-bold">N</div>
          <span className="font-semibold text-sm tracking-tight">Nova</span>
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        <button
          onClick={() => setOpen(true)}
          className={cn(buttonVariants({ variant: 'ghost' }), 'gap-2 px-2 h-9 text-sm font-medium min-w-0')}
          aria-label="Switch workspace"
        >
          <span>{wsIcon}</span>
          <span className="truncate">{wsName}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col gap-0" showCloseButton={false}>
          <div className="p-3 border-b">
            <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Workspaces</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'w-full justify-between px-2 h-9 text-sm font-medium'
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span>{wsIcon}</span>
                  <span className="truncate">{wsName}</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => { setActiveWorkspaceId(ws.id); setOpen(false) }}
                    className={cn(ws.id === activeWorkspaceId && 'bg-accent')}
                  >
                    <span className="mr-2">{WORKSPACE_TYPE_ICONS[ws.type]}</span>
                    {ws.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { router.push('/settings?tab=workspaces'); setOpen(false) }}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  New workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
