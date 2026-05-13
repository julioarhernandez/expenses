'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Receipt, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function MobileBottomNav({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const initials = (user.email ?? '?').slice(0, 2).toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 pb-8 pt-4 z-50">
      <div className="flex items-center justify-between max-w-lg mx-auto relative">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          
          return (
            <Link 
              key={href}
              href={href} 
              className={cn(
                "flex-1 flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "-mt-8 relative z-10" : ""
              )}
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-300 transform active:scale-95",
                isActive 
                  ? "w-14 h-14 rounded-2xl bg-[#6366F1] shadow-xl shadow-indigo-200 text-white ring-4 ring-white" 
                  : "w-6 h-6 text-slate-400 group-hover:text-indigo-600"
              )}>
                <Icon className={cn("transition-all", isActive ? "w-7 h-7" : "w-5 h-5")} strokeWidth={2.5} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                isActive ? "text-[#6366F1] mt-1" : "text-slate-400"
              )}>
                {label}
              </span>
            </Link>
          )
        })}

        {/* Account / User Menu */}
        <div className="flex-1 flex flex-col items-center gap-1 group">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-col items-center gap-1 outline-none">
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold overflow-hidden transition-colors",
                "bg-slate-100 border-slate-200 text-slate-500 group-hover:border-indigo-500"
              )}>
                {initials}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48 mb-4 rounded-2xl p-2 shadow-xl border-slate-100">
              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">{user.email}</div>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl focus:bg-slate-50">
                <Settings className="mr-2 h-4 w-4" />Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem onClick={signOut} className="rounded-xl focus:bg-red-50 text-red-500 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </footer>
  )
}
