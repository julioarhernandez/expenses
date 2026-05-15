'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Receipt, Settings, LogOut, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/hooks/useTranslation'
import { createClient } from '@/lib/supabase/client'
import { useExpenseStore } from '@/store/expenses'
import type { User } from '@supabase/supabase-js'

export function MobileBottomNav({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()
  const openDialog = useExpenseStore((s) => s.openDialog)
  const initials = (user.email ?? '?').slice(0, 2).toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const leftItems = [
    { href: '/dashboard', label: t('nav').dashboard, icon: LayoutDashboard },
    { href: '/expenses', label: t('nav').expenses, icon: Receipt },
  ]

  const rightItems = [
    { href: '/settings', label: t('nav').settings, icon: Settings },
  ]

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[90px] flex items-end pointer-events-none">
      {/* Custom Background - Simple Div approach */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[70px] bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto"
      />

      {/* Navigation Content */}
      <div className="relative w-full max-w-lg mx-auto px-4 h-[70px] flex items-center justify-between pointer-events-auto">
        {/* Left Side */}
        <div className="flex-1 flex justify-around items-center">
          {leftItems.map((item) => (
            <NavItem key={item.href} {...item} isActive={pathname === item.href} />
          ))}
        </div>

        {/* Center Plus Button */}
        <div className="relative w-20 h-20 -top-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#6366F1] rounded-full blur-2xl opacity-20 animate-pulse" />
          <button 
            onClick={() => openDialog()}
            className="group relative w-14 h-14 bg-[#6366F1] rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(99,102,241,0.4)] text-white transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Plus className="w-7 h-7 transition-transform group-hover:rotate-90" strokeWidth={3} />
          </button>
        </div>

        {/* Right Side */}
        <div className="flex-1 flex justify-around items-center">
          {rightItems.map((item) => (
            <NavItem key={item.href} {...item} isActive={pathname === item.href} />
          ))}
          
          {/* Account Dropdown */}
          <div className="flex flex-col items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center gap-1.5 outline-none group">
                <div className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold overflow-hidden transition-all duration-300",
                  "bg-muted border-border text-muted-foreground group-hover:border-indigo-400 group-hover:text-indigo-600"
                )}>
                  {initials}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground group-hover:text-indigo-600 transition-colors">
                  {t('nav').account}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-52 mb-4 rounded-2xl p-2 shadow-2xl border-border bg-background/95 backdrop-blur-xl">
                <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 mb-1 truncate">{user.email}</div>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl focus:bg-accent cursor-pointer py-2.5">
                  <Settings className="mr-2.5 h-4 w-4" />{t('nav').settings}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={signOut} variant="destructive" className="rounded-xl cursor-pointer py-2.5">
                  <LogOut className="mr-2.5 h-4 w-4" />{t('nav').logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </footer>
  )
}

function NavItem({ href, label, icon: Icon, isActive }: { href: string, label: string, icon: any, isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all duration-300 group",
        isActive ? "text-[#6366F1]" : "text-muted-foreground hover:text-indigo-400"
      )}
    >
      <div className="relative">
        {isActive && (
          <div className="absolute inset-0 bg-[#6366F1] blur-md opacity-25 animate-pulse" />
        )}
        <Icon 
          className={cn(
            "w-5.5 h-5.5 transition-all duration-300 transform group-active:scale-90", 
            isActive ? "stroke-[2.5px] scale-110" : "stroke-[2px]"
          )} 
        />
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-[0.05em] transition-colors",
        isActive ? "text-[#6366F1]" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </Link>
  )
}

