'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Receipt, Settings, LogOut, ChevronDown, Plus, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkspaceStore } from '@/store/workspace'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const WORKSPACE_TYPE_ICONS: Record<string, string> = {
  personal: '👤',
  business: '🏢',
  freelance: '💼',
  side_project: '🚀',
}

export function TopNav({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspaceStore()
  const active = activeWorkspace()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const wsIcon = mounted && active ? WORKSPACE_TYPE_ICONS[active.type] : '📁'
  const wsName = mounted && active ? active.name : 'Workspace'
  const initials = (user.email ?? '?').slice(0, 2).toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="hidden md:flex items-center gap-4 px-6 h-14 border-b bg-background shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-white text-sm font-bold">N</div>
        <span className="font-semibold text-sm tracking-tight">Nova</span>
      </Link>

      {/* Workspace switcher — beside logo */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors outline-none">
          <span>{wsIcon}</span>
          <span className="max-w-32 truncate">{wsName}</span>
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

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Briefcase className="mr-2 h-4 w-4" />Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
