import type { Tag } from '@/lib/types'
import { tagColorValue } from '@/lib/tag-colors'
import { cn } from '@/lib/utils'

export function TagDot({
  color,
  className,
}: {
  color: string
  className?: string
}) {
  return (
    <span
      className={cn('inline-block size-2.5 rounded-full', className)}
      style={{ backgroundColor: tagColorValue(color) }}
      aria-hidden="true"
    />
  )
}

export function TagBadge({
  tag,
  className,
}: {
  tag: Tag | undefined
  className?: string
}) {
  if (!tag) {
    return <span className="text-muted-foreground">(削除済みタグ)</span>
  }
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <TagDot color={tag.color} />
      <span className="font-medium">{tag.name}</span>
    </span>
  )
}
