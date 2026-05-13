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
        const currentActive = get().activeWorkspaceId
        const activeExists = currentActive ? workspaces.some(w => w.id === currentActive) : false

        if (!activeExists && workspaces.length > 0) {
          const defaultWs = workspaces.find((w) => w.is_default) || workspaces[0]
          set({ activeWorkspaceId: defaultWs.id })
          if (typeof document !== 'undefined') {
            document.cookie = `active-workspace-id=${defaultWs.id}; path=/; max-age=31536000`
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
