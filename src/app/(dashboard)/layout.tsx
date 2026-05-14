import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/layout/TopNav'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { WorkspaceProvider } from '@/components/layout/WorkspaceProvider'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { VoiceExpenseFAB } from '@/components/expenses/VoiceExpenseFAB'
import { GlobalExpenseDialog } from '@/components/expenses/GlobalExpenseDialog'
import type { Workspace } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <WorkspaceProvider workspaces={(workspaces as Workspace[]) ?? []}>
      <ThemeProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <TopNav user={user} />
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pb-40 md:pb-0 bg-gradient-to-b from-muted to-muted/40">{children}</main>
      </div>
      <MobileBottomNav user={user} />
      <VoiceExpenseFAB />
      <GlobalExpenseDialog />
      </ThemeProvider>
    </WorkspaceProvider>
  )
}
