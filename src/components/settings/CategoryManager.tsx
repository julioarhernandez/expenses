'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import type { Category } from '@/types'

const PRESET_COLORS = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#10b981',
  '#f43f5e', '#8b5cf6', '#64748b', '#f97316',
  '#06b6d4', '#84cc16',
]

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const supabase = createClient()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  async function addCategory() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (!activeWorkspaceId) throw new Error('No active workspace')
      const duplicate = categories.some(
        (c) => c.name.toLowerCase() === newName.trim().toLowerCase()
      )
      if (duplicate) throw new Error(`Category "${newName.trim()}" already exists`)
      const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: user.id, workspace_id: activeWorkspaceId, name: newName.trim(), color: newColor, is_default: false })
        .select()
        .single()
      if (error) throw error
      setCategories([...categories, data as Category])
      setNewName('')
      toast.success('Category added')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add category')
    } finally {
      setAdding(false)
    }
  }

  async function deleteCategory(cat: Category) {
    try {
      await supabase.from('categories').delete().eq('id', cat.id)
      setCategories(categories.filter((c) => c.id !== cat.id))
      toast.success('Category deleted')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          Categories
          <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
            {categories.length} Total
          </span>
        </h2>
        <button
          onClick={() => setEditing((e) => !e)}
          className={`p-2 rounded-xl transition-colors ${editing ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
          title={editing ? 'Done' : 'Edit categories'}
        >
          {editing ? <Check className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium py-4 italic">No categories created yet.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1 group">
              <div 
                style={{ backgroundColor: cat.color + '15', color: cat.color, borderColor: cat.color + '30' }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105"
              >
                {cat.name}
              </div>
              {editing && (
                <button
                  onClick={() => deleteCategory(cat)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Category Form */}
      <div className="pt-6 border-t border-slate-100">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <input 
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none" 
                placeholder="Category name..." 
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
            </div>
            <button 
              onClick={addCategory}
              disabled={adding || !newName.trim()}
              className="w-full sm:w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-7 w-7 rounded-full ring-offset-2 transition-all ${newColor === c ? 'ring-2 ring-slate-900 scale-110' : 'hover:scale-110 opacity-60 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
