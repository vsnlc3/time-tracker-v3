'use client'

import * as React from 'react'
import { Brain, Check, Coffee, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { SegmentType, Session } from '@/lib/types'
import { useStore } from '@/lib/store'
import {
  datetimeLocalToEpoch,
  epochToDatetimeLocal,
  formatHuman,
  segmentDuration,
} from '@/lib/time'
import { TagSelect } from '@/components/tag-select'

export function EditSessionDialog({
  session,
  open,
  onOpenChange,
}: {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const {
    now,
    updateSessionTag,
    updateSegmentType,
    updateSegmentStart,
    updateSegmentEnd,
    deleteSegment,
  } = useStore()

  if (!session) return null
  const segs = [...session.segments].sort((a, b) => a.start - b.start)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>セッションを編集</DialogTitle>
          <DialogDescription>
            タグや各区間の時刻・状態を修正できます。開始・終了は隣接する区間に連動します。
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel>タグ</FieldLabel>
          <TagSelect
            value={session.tagId}
            onChange={async (v) => {
              const result = await updateSessionTag(session.id, v)
              if (!result.ok) toast.error(result.error)
            }}
            className="w-full"
          />
        </Field>

        <Separator />

        <div className="flex flex-col gap-4">
          {segs.map((seg) => (
            <SegmentEditor
              key={seg.id}
              seg={seg}
              duration={formatHuman(segmentDuration(seg, now))}
              onType={async (t) => {
                const r = await updateSegmentType(session.id, seg.id, t)
                if (!r.ok) toast.error(r.error)
              }}
              onStart={async (epoch) => {
                const r = await updateSegmentStart(session.id, seg.id, epoch)
                if (!r.ok) toast.error(r.error)
              }}
              onEnd={async (epoch) => {
                const r = await updateSegmentEnd(session.id, seg.id, epoch)
                if (!r.ok) toast.error(r.error)
              }}
              onDelete={async () => {
                const r = await deleteSegment(session.id, seg.id)
                if (!r.ok) toast.error(r.error)
                else toast.success('区間を削除しました。')
              }}
              canDelete={segs.length > 1}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SegmentEditor({
  seg,
  duration,
  onType,
  onStart,
  onEnd,
  onDelete,
  canDelete,
}: {
  seg: Session['segments'][number]
  duration: string
  onType: (t: SegmentType) => void
  onStart: (epoch: number) => void
  onEnd: (epoch: number) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const [start, setStart] = React.useState(epochToDatetimeLocal(seg.start))
  const [end, setEnd] = React.useState(
    seg.end != null ? epochToDatetimeLocal(seg.end) : '',
  )

  React.useEffect(() => {
    setStart(epochToDatetimeLocal(seg.start))
    setEnd(seg.end != null ? epochToDatetimeLocal(seg.end) : '')
  }, [seg.start, seg.end])

  const isFocus = seg.type === 'FOCUS'

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <ToggleGroup
          value={[seg.type]}
          onValueChange={(v) => v[0] && onType(v[0] as SegmentType)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem
            value="FOCUS"
            className="data-[state=on]:!bg-focus-muted data-[state=on]:!text-focus"
          >
            <Brain data-icon="inline-start" />
            FOCUS
          </ToggleGroupItem>
          <ToggleGroupItem
            value="BREAK"
            className="data-[state=on]:!bg-break-muted data-[state=on]:!text-break"
          >
            <Coffee data-icon="inline-start" />
            BREAK
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {duration}
          </span>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="区間を削除"
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="h-9"
          aria-label={`${isFocus ? 'FOCUS' : 'BREAK'} 開始時刻`}
        />
        <Button
          variant="outline"
          size="icon"
          aria-label="開始時刻を適用"
          onClick={() => start && onStart(datetimeLocalToEpoch(start))}
        >
          <Check />
        </Button>
        <Input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="h-9"
          disabled={seg.end == null}
          aria-label={`${isFocus ? 'FOCUS' : 'BREAK'} 終了時刻`}
        />
        <Button
          variant="outline"
          size="icon"
          aria-label="終了時刻を適用"
          disabled={seg.end == null}
          onClick={() => end && onEnd(datetimeLocalToEpoch(end))}
        >
          <Check />
        </Button>
      </div>
    </div>
  )
}
