'use client'

import { useEffect } from 'react'
import { useWorkspaceStore } from '@/store/workspace'
import type { Workspace } from '@/types'

export function WorkspaceProvider({
  workspaces,
  children,
}: {
  workspaces: Workspace[]
  children: React.ReactNode
}) {
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces)

  useEffect(() => {
    setWorkspaces(workspaces)
  }, [workspaces, setWorkspaces])

  return <>{children}</>
}
