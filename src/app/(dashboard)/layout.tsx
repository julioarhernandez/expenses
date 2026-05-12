import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { WorkspaceProvider } from '@/components/layout/WorkspaceProvider'
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
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
        </div>
      </div>
      <MobileBottomNav user={user} />
    </WorkspaceProvider>
  )
}
