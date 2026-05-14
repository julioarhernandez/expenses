'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Receipt, Settings, LogOut, ChevronDown, Plus, Briefcase, User as UserIcon, HelpCircle } from 'lucide-react'
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
import { useTranslation } from '@/hooks/useTranslation'
import { useHelpStore } from '@/store/help'
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
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspaceStore()
  const { t, lang } = useTranslation()
  const active = activeWorkspace()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { openHelp } = useHelpStore()

  const navItems = [
    { href: '/dashboard', label: t('nav').dashboard, icon: LayoutDashboard },
    { href: '/expenses', label: t('nav').expenses, icon: Receipt },
    { href: '/settings', label: t('nav').settings, icon: Settings },
    { href: '/settings?tab=profile', label: t('nav').account, icon: UserIcon },
  ]

  const wsIcon = mounted && active ? WORKSPACE_TYPE_ICONS[active.type] : '📁'
  const wsName = mounted && active ? active.name : (lang === 'es' ? 'Espacio' : 'Workspace')
  const initials = (user.email ?? '?').slice(0, 2).toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="hidden md:flex items-center gap-4 px-6 h-16 border-b border-border bg-background sticky top-0 z-50 shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
        <div className="w-10 h-10 bg-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 transition-transform group-hover:scale-105">
          <span className="text-white font-bold text-xl">N</span>
        </div>
        <span className="font-bold text-lg tracking-tight text-foreground">Nova</span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1 ml-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[#6366F1]")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help */}
      <button
        onClick={() => openHelp()}
        className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        title="Help"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* Workspace switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full border border-border transition-all hover:bg-accent active:scale-95 outline-none min-w-0">
          <span className="text-lg">{wsIcon}</span>
          <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">{wsName}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
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
                "rounded-xl px-3 py-2 cursor-pointer transition-colors",
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
            <span className="font-semibold">
              {t('nav').new_workspace}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
            <Briefcase className="mr-2 h-4 w-4" />{t('nav').settings}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />{t('nav').logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
