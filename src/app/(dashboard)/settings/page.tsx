'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceManager } from '@/components/settings/WorkspaceManager'
import { CategoryManager } from '@/components/settings/CategoryManager'

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your workspaces and categories</p>
      </div>

      <Tabs defaultValue="workspaces">
        <TabsList>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="workspaces" className="mt-4">
          <WorkspaceManager />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
