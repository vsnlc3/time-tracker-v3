'use client'

import * as React from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import type { Session } from '@/lib/types'
import { useStore, useTagMap } from '@/lib/store'
import {
  breakMs,
  focusMs,
  formatClock,
  formatDateLabel,
  formatHuman,
  MINUTE,
} from '@/lib/time'
import { TagBadge } from '@/components/tag-badge'
import { EditSessionDialog } from '@/components/edit-session-dialog'

type Row =
  | { kind: 'session'; at: number; day: string; session: Session }
  | {
      kind: 'manual'
      at: number
      day: string
      id: string
      tagId: string
      focusMin: number
      breakMin: number
    }

export function RecordsView() {
  const { state, now, deleteSession, deleteManualRecord } = useStore()
  const tagMap = useTagMap()
  const [editing, setEditing] = React.useState<Session | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const editingSession = editing
    ? state.sessions.find((session) => session.id === editing.id) ?? null
    : null

  const groups = React.useMemo(() => {
    const rows: Row[] = []
    for (const s of state.sessions) {
      if (s.end === null) continue
      rows.push({ kind: 'session', at: s.start, day: s.activityDate, session: s })
    }
    for (const r of state.manualRecords) {
      const [y, m, d] = r.date.split('-').map(Number)
      rows.push({
        kind: 'manual',
        at: new Date(y, m - 1, d, 12).getTime(),
        day: r.date,
        id: r.id,
        tagId: r.tagId,
        focusMin: r.focusMin,
        breakMin: r.breakMin,
      })
    }
    const byDay = new Map<string, Row[]>()
    for (const row of rows) {
      const key = row.day
      const arr = byDay.get(key) ?? []
      arr.push(row)
      byDay.set(key, arr)
    }
    return [...byDay.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([day, list]) => {
        list.sort((a, b) => b.at - a.at)
        const total = list.reduce((sum, row) => {
          if (row.kind === 'session') {
            return sum + focusMs(row.session, now) + breakMs(row.session, now)
          }
          return sum + (row.focusMin + row.breakMin) * MINUTE
        }, 0)
        return { day, list, total }
      })
  }, [state.sessions, state.manualRecords, now])

  function openEdit(s: Session) {
    setEditing(s)
    setEditOpen(true)
  }

  if (groups.length === 0) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyTitle>記録がありません</EmptyTitle>
          <EmptyDescription>
            セッションを終了するか、手動で記録を追加すると、ここに履歴が表示されます。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.day} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{formatDateLabel(g.day)}</h2>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              合計 {formatHuman(g.total)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {g.list.map((row) =>
              row.kind === 'session' ? (
                <SessionRow
                  key={row.session.id}
                  session={row.session}
                  now={now}
                  tag={tagMap[row.session.tagId]}
                  onEdit={() => openEdit(row.session)}
                  onDelete={async () => {
                    const res = await deleteSession(row.session.id)
                    if (!res.ok) toast.error(res.error)
                    else toast.success('セッションを削除しました。')
                  }}
                />
              ) : (
                <ManualRow
                  key={row.id}
                  tag={tagMap[row.tagId]}
                  focusMin={row.focusMin}
                  breakMin={row.breakMin}
                  onDelete={async () => {
                    const res = await deleteManualRecord(row.id)
                    if (!res.ok) toast.error(res.error)
                    else toast.success('記録を削除しました。')
                  }}
                />
              ),
            )}
          </div>
        </section>
      ))}

      <EditSessionDialog
        session={editingSession}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}

function SessionRow({
  session,
  now,
  tag,
  onEdit,
  onDelete,
}: {
  session: Session
  now: number
  tag: ReturnType<typeof useTagMap>[string] | undefined
  onEdit: () => void
  onDelete: () => void
}) {
  const f = focusMs(session, now)
  const b = breakMs(session, now)
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-1">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <TagBadge tag={tag} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground tabular-nums">
            <span>
              {formatClock(session.start)}–{formatClock(session.end!)}
            </span>
            <span className="text-focus">集中 {formatHuman(f)}</span>
            <span className="text-break">休憩 {formatHuman(b)}</span>
            <span>{session.segments.length}区間</span>
          </div>
        </div>
        <span className="ml-auto font-mono text-sm font-semibold tabular-nums">
          {formatHuman(f + b)}
        </span>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="編集"
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <DeleteButton
            title="このセッションを削除しますか？"
            onConfirm={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ManualRow({
  tag,
  focusMin,
  breakMin,
  onDelete,
}: {
  tag: ReturnType<typeof useTagMap>[string] | undefined
  focusMin: number
  breakMin: number
  onDelete: () => void
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-1">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <TagBadge tag={tag} />
            <Badge variant="secondary">手動</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground tabular-nums">
            <span className="text-focus">集中 {formatHuman(focusMin * MINUTE)}</span>
            <span className="text-break">休憩 {formatHuman(breakMin * MINUTE)}</span>
          </div>
        </div>
        <span className="ml-auto font-mono text-sm font-semibold tabular-nums">
          {formatHuman((focusMin + breakMin) * MINUTE)}
        </span>
        <div className="flex shrink-0 items-center">
          <DeleteButton title="この記録を削除しますか？" onConfirm={onDelete} />
        </div>
      </CardContent>
    </Card>
  )
}

function DeleteButton({
  title,
  onConfirm,
}: {
  title: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="削除">
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>削除する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
