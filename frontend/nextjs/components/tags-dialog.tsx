'use client'

import * as React from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/lib/store'
import { TAG_COLORS, tagColorValue } from '@/lib/tag-colors'
import { cn } from '@/lib/utils'

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {TAG_COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          aria-label={c.label}
          onClick={() => onChange(c.key)}
          className={cn(
            'flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition',
            value === c.key && 'ring-2 ring-ring',
          )}
          style={{ backgroundColor: c.value }}
        >
          {value === c.key && (
            <Check className="size-3.5 text-background" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  )
}

export function TagsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, addTag, renameTag, updateTagColor, deleteTag } = useStore()
  const [newName, setNewName] = React.useState('')
  const [newColor, setNewColor] = React.useState(TAG_COLORS[0].key)
  const [names, setNames] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    setNames((current) => {
      const next = { ...current }
      for (const tag of state.tags) {
        if (!(tag.id in next)) next[tag.id] = tag.name
      }
      return next
    })
  }, [state.tags])

  async function handleAdd() {
    const res = await addTag(newName, newColor)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setNewName('')
    toast.success('タグを追加しました。')
  }

  async function handleDelete(id: string) {
    const res = await deleteTag(id)
    if (!res.ok) toast.error(res.error)
    else toast.success('タグを削除しました。')
  }

  async function handleRename(id: string) {
    const nextName = names[id] ?? ''
    const res = await renameTag(id, nextName)
    if (!res.ok) {
      toast.error(res.error)
      const tag = state.tags.find((item) => item.id === id)
      if (tag) setNames((current) => ({ ...current, [id]: tag.name }))
    } else {
      setNames((current) => ({ ...current, [id]: nextName.trim() }))
    }
  }

  async function handleColor(id: string, color: string) {
    const res = await updateTagColor(id, color)
    if (!res.ok) toast.error(res.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>タグを管理</DialogTitle>
          <DialogDescription>
            活動の種類を表すタグを追加・編集できます。
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-3">
          {state.tags.map((tag) => (
            <li key={tag.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: tagColorValue(tag.color) }}
                />
                <Input
                  value={names[tag.id] ?? tag.name}
                  onChange={(e) =>
                    setNames((current) => ({ ...current, [tag.id]: e.target.value }))
                  }
                  onBlur={() => void handleRename(tag.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                      event.currentTarget.blur()
                    }
                  }}
                  className="h-9"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${tag.name} を削除`}
                  onClick={() => handleDelete(tag.id)}
                >
                  <Trash2 />
                </Button>
              </div>
              <ColorPicker
                value={tag.color}
                onChange={(c) => void handleColor(tag.id, c)}
              />
            </li>
          ))}
        </ul>

        <Separator />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">新しいタグ</p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="タグ名（例: 読書）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  handleAdd()
                }
              }}
            />
            <Button onClick={handleAdd}>
              <Plus data-icon="inline-start" />
              追加
            </Button>
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
