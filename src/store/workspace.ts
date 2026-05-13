import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace } from '@/types'

interface WorkspaceStore {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  language: 'en-US' | 'es-ES'
  setWorkspaces: (workspaces: Workspace[]) => void
  setActiveWorkspaceId: (id: string) => void
  setLanguage: (lang: 'en-US' | 'es-ES') => void
  activeWorkspace: () => Workspace | null
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      language: 'en-US',
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
      setLanguage: (lang) => set({ language: lang }),
      activeWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get()
        return workspaces.find((w) => w.id === activeWorkspaceId) ?? null
      },
    }),
    { name: 'nova-workspace' }
  )
)
