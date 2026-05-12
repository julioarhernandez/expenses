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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Categories</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => setEditing((e) => !e)}
          title={editing ? 'Done' : 'Edit categories'}
        >
          {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1">
              <Badge
                variant="secondary"
                style={{ backgroundColor: cat.color + '20', color: cat.color }}
                className="text-sm"
              >
                {cat.name}
              </Badge>
              {editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteCategory(cat)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 flex-wrap">
          <Input
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            className="flex-1 min-w-40"
          />
          <div className="flex gap-1.5 items-center flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-6 w-6 rounded-full ring-offset-2 transition-all ${newColor === c ? 'ring-2 ring-foreground' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
          <Button onClick={addCategory} disabled={adding || !newName.trim()}>
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
