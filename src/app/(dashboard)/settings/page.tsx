'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceManager } from '@/components/settings/WorkspaceManager'
import { CategoryManager } from '@/components/settings/CategoryManager'

export default function SettingsPage() {
  return (
    <div className="min-h-full bg-[#F8FAFC] px-6 pt-8 pb-32">
      {/* Header Section */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">Settings</h1>
        <p className="text-slate-500 font-medium">Manage your workspaces and categories</p>
      </section>

      <Tabs defaultValue="workspaces" className="w-full">
        {/* Tab Navigation */}
        <TabsList className="flex p-1.5 bg-slate-200/50 rounded-2xl mb-8 h-auto">
          <TabsTrigger 
            value="workspaces" 
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-700 transition-all"
          >
            Workspaces
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-700 transition-all"
          >
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces" className="mt-0 outline-none">
          <WorkspaceManager />
        </TabsContent>
        <TabsContent value="categories" className="mt-0 outline-none">
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
