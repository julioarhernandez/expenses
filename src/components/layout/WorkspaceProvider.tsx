'use client'

import { useEffect } from 'react'
import { useWorkspaceStore } from '@/store/workspace'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import type { Workspace } from '@/types'

export function WorkspaceProvider({
  workspaces,
  children,
}: {
  workspaces: Workspace[]
  children: React.ReactNode
}) {
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces)
  useOfflineSync()

  useEffect(() => {
    setWorkspaces(workspaces)
  }, [workspaces, setWorkspaces])

  return <>{children}</>
}
