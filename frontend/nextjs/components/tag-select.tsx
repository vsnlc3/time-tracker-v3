'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { TagDot } from '@/components/tag-badge'

export function TagSelect({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const { state } = useStore()
  const items = Object.fromEntries(state.tags.map((t) => [t.id, t.name]))
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => onChange(v as string)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="タグを選択">
          {(val: string) => {
            const tag = state.tags.find((t) => t.id === val)
            if (!tag) return 'タグを選択'
            return (
              <>
                <TagDot color={tag.color} />
                {tag.name}
              </>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {state.tags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              <TagDot color={tag.color} />
              {tag.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
