'use client'

import { useState } from 'react'
import { Plus, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import type { Workspace, WorkspaceType } from '@/types'

const WORKSPACE_TYPES: { value: WorkspaceType; label: string; emoji: string }[] = [
  { value: 'personal', label: 'Personal', emoji: '👤' },
  { value: 'business', label: 'Business', emoji: '🏢' },
  { value: 'freelance', label: 'Freelance', emoji: '💼' },
  { value: 'side_project', label: 'Side project', emoji: '🚀' },
]

export function WorkspaceManager() {
  const { workspaces, setWorkspaces, setActiveWorkspaceId } = useWorkspaceStore()
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<WorkspaceType>('business')
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  async function addWorkspace() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: ws, error } = await supabase
        .from('workspaces')
        .insert({ user_id: user.id, name: newName.trim(), type: newType, is_default: false })
        .select()
        .single()
      if (error) throw error
      const updated = [...workspaces, ws as Workspace]
      setWorkspaces(updated)
      setNewName('')
      toast.success('Workspace created')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setAdding(false)
    }
  }

  async function setDefault(ws: Workspace) {
    try {
      await supabase.from('workspaces').update({ is_default: false }).eq('is_default', true)
      await supabase.from('workspaces').update({ is_default: true }).eq('id', ws.id)
      const updated = workspaces.map((w) => ({ ...w, is_default: w.id === ws.id }))
      setWorkspaces(updated)
      setActiveWorkspaceId(ws.id)
      toast.success(`"${ws.name}" is now the default workspace`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update default')
    }
  }

  async function deleteWorkspace(ws: Workspace) {
    if (workspaces.length <= 1) {
      toast.error('You must have at least one workspace')
      return
    }
    if (!confirm(`Delete workspace "${ws.name}"? All expenses in it will be deleted.`)) return
    try {
      await supabase.from('workspaces').delete().eq('id', ws.id)
      const updated = workspaces.filter((w) => w.id !== ws.id)
      setWorkspaces(updated)
      toast.success('Workspace deleted')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete workspace')
    }
  }

  const typeMap = Object.fromEntries(WORKSPACE_TYPES.map((t) => [t.value, t]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspaces</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {workspaces.map((ws) => (
            <div key={ws.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span>{typeMap[ws.type]?.emoji ?? '📁'}</span>
                <span className="text-sm font-medium truncate">{ws.name}</span>
                {ws.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!ws.is_default && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDefault(ws)} title="Set as default">
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteWorkspace(ws)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Workspace name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addWorkspace()}
            className="flex-1"
          />
          <Select
            value={newType}
            onValueChange={(v) => setNewType(v as WorkspaceType)}
            items={WORKSPACE_TYPES.map((t) => ({ value: t.value, label: `${t.emoji} ${t.label}` }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKSPACE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addWorkspace} disabled={adding || !newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
