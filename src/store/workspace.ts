import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace } from '@/types'

interface WorkspaceStore {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  setWorkspaces: (workspaces: Workspace[]) => void
  setActiveWorkspaceId: (id: string) => void
  activeWorkspace: () => Workspace | null
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      setWorkspaces: (workspaces) => {
        set({ workspaces })
        if (!get().activeWorkspaceId && workspaces.length > 0) {
          const def = workspaces.find((w) => w.is_default) ?? workspaces[0]
          set({ activeWorkspaceId: def.id })
        }
      },
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      activeWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get()
        return workspaces.find((w) => w.id === activeWorkspaceId) ?? null
      },
    }),
    { name: 'nova-workspace' }
  )
)
