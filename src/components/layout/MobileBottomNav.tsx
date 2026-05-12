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

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileBottomNav({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const initials = (user.email ?? '?').slice(0, 2).toUpperCase()
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
            {label}
          </Link>
        )
      })}

      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
          <Avatar className="h-5 w-5">
            <AvatarImage src={avatarUrl} alt={user.email ?? ''} />
            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
          </Avatar>
          Account
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-48 mb-1">
          <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
