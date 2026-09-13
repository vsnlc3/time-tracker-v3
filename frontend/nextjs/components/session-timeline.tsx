import { Brain, Coffee } from 'lucide-react'
import type { Session } from '@/lib/types'
import { formatClock, formatHuman, segmentDuration } from '@/lib/time'
import { cn } from '@/lib/utils'

export function SessionTimeline({
  session,
  now,
}: {
  session: Session
  now: number
}) {
  const segs = [...session.segments].sort((a, b) => a.start - b.start)
  return (
    <ol className="flex flex-col gap-1.5">
      {segs.map((seg) => {
        const isFocus = seg.type === 'FOCUS'
        const running = seg.end === null
        const Icon = isFocus ? Brain : Coffee
        return (
          <li
            key={seg.id}
            className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm"
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md',
                isFocus
                  ? 'bg-focus-muted text-focus'
                  : 'bg-break-muted text-break',
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <span
              className={cn(
                'w-12 shrink-0 text-xs font-semibold',
                isFocus ? 'text-focus' : 'text-break',
              )}
            >
              {isFocus ? 'FOCUS' : 'BREAK'}
            </span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {formatClock(seg.start)} – {running ? '進行中' : formatClock(seg.end!)}
            </span>
            <span className="ml-auto font-mono text-xs tabular-nums">
              {formatHuman(segmentDuration(seg, now))}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
