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
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        Workspaces
        <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
          {workspaces.length} Total
        </span>
      </h2>

      {/* Workspace List */}
      <div className="space-y-4 mb-8">
        {workspaces.map((ws) => {
          const typeInfo = typeMap[ws.type] || { emoji: '📁' }
          const isDefault = ws.is_default

          return (
            <div 
              key={ws.id} 
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                isDefault 
                  ? 'bg-indigo-50/30 border-indigo-100 shadow-sm shadow-indigo-100/50' 
                  : 'bg-slate-50/50 border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-md hover:shadow-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                  ws.type === 'personal' ? 'bg-purple-100' : 
                  ws.type === 'business' ? 'bg-blue-100' : 
                  ws.type === 'freelance' ? 'bg-emerald-100' : 'bg-orange-100'
                }`}>
                  {typeInfo.emoji}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 truncate">{ws.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-4">
                  <button 
                    onClick={() => !isDefault && setDefault(ws)}
                    className={`p-2 transition-colors ${isDefault ? 'text-amber-400 cursor-default' : 'text-slate-300 hover:text-amber-400'}`} 
                    title={isDefault ? "Default workspace" : "Set as default"}
                  >
                    <svg className="w-5 h-5" fill={isDefault ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </button>
                <button 
                  onClick={() => deleteWorkspace(ws)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add New Workspace Form */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <input 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none" 
              placeholder="Workspace name..." 
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWorkspace()}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-60">
              <span className="text-sm">{typeMap[newType]?.emoji}</span>
              <svg className="w-3 h-3 ml-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            
            {/* Hidden select for workspace type, accessible via click on emoji */}
            <select 
              className="absolute left-0 top-0 w-11 h-full opacity-0 cursor-pointer"
              value={newType}
              onChange={(e) => setNewType(e.target.value as WorkspaceType)}
            >
              {WORKSPACE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={addWorkspace}
            disabled={adding || !newName.trim()}
            className="w-full sm:w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
