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
          const first = workspaces[0]
          set({ activeWorkspaceId: first.id })
          if (typeof document !== 'undefined') {
            document.cookie = `active-workspace-id=${first.id}; path=/; max-age=31536000`
          }
        }
      },
      setActiveWorkspaceId: (id) => {
        set({ activeWorkspaceId: id })
        if (typeof document !== 'undefined') {
          document.cookie = `active-workspace-id=${id}; path=/; max-age=31536000`
        }
      },
      activeWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get()
        return workspaces.find((w) => w.id === activeWorkspaceId) ?? null
      },
    }),
    { name: 'nova-workspace' }
  )
)
