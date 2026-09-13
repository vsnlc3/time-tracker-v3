'use client'

import * as React from 'react'
import { Brain, CalendarDays, Coffee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { TagDot } from '@/components/tag-badge'
import { useStore } from '@/lib/store'
import { tagColorValue } from '@/lib/tag-colors'
import {
  breakMs,
  dateKey,
  focusMs,
  formatDateLabel,
  formatHuman,
  MINUTE,
} from '@/lib/time'
import { cn } from '@/lib/utils'

export function TodaySummary() {
  const { state, now, summary } = useStore()
  const today = dateKey(now)

  const data = React.useMemo(() => {
    if (summary?.activityDate === today) {
      return {
        focus: summary.focusSeconds * 1000,
        brk: summary.breakSeconds * 1000,
        total: summary.totalSeconds * 1000,
        tags: summary.tagSummaries.map((tag) => ({
          tagId: String(tag.tagId),
          focus: tag.focusSeconds * 1000,
          break: tag.breakSeconds * 1000,
          total: tag.totalSeconds * 1000,
        })),
      }
    }
    const todaySessions = state.sessions.filter(
      (s) => s.activityDate === today,
    )
    const todayManual = state.manualRecords.filter((r) => r.date === today)

    const perTag = new Map<
      string,
      { focus: number; break: number; total: number }
    >()
    const bump = (tagId: string, focus: number, brk: number) => {
      const cur = perTag.get(tagId) ?? { focus: 0, break: 0, total: 0 }
      cur.focus += focus
      cur.break += brk
      cur.total += focus + brk
      perTag.set(tagId, cur)
    }

    let focus = 0
    let brk = 0
    for (const s of todaySessions) {
      const f = focusMs(s, now)
      const b = breakMs(s, now)
      focus += f
      brk += b
      bump(s.tagId, f, b)
    }
    for (const r of todayManual) {
      focus += r.focusMin * MINUTE
      brk += r.breakMin * MINUTE
      bump(r.tagId, r.focusMin * MINUTE, r.breakMin * MINUTE)
    }

    const tags = [...perTag.entries()]
      .map(([tagId, v]) => ({ tagId, ...v }))
      .sort((a, b) => b.total - a.total)

    return { focus, brk, total: focus + brk, tags }
  }, [state, summary, today, now])

  const tagMap = React.useMemo(() => {
    const m: Record<string, (typeof state.tags)[number]> = {}
    for (const t of state.tags) m[t.id] = t
    return m
  }, [state])

  const focusPct = data.total ? (data.focus / data.total) * 100 : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="size-4" />
        {formatDateLabel(today)}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BigStat label="合計" value={formatHuman(data.total)} />
        <BigStat
          label="FOCUS"
          value={formatHuman(data.focus)}
          icon={<Brain className="size-4" />}
          tone="focus"
        />
        <BigStat
          label="BREAK"
          value={formatHuman(data.brk)}
          icon={<Coffee className="size-4" />}
          tone="break"
        />
      </div>

      {data.total > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>集中と休憩の比率</span>
              <span className="font-mono tabular-nums">
                FOCUS {Math.round(focusPct)}%
              </span>
            </div>
            <SplitBar focus={data.focus} brk={data.brk} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">タグ別の内訳</CardTitle>
        </CardHeader>
        <CardContent>
          {data.tags.length === 0 ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyTitle>まだ記録がありません</EmptyTitle>
                <EmptyDescription>
                  セッションを開始するか、手動で時間を追加しましょう。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-4">
              {data.tags.map((t) => {
                const tag = tagMap[t.tagId]
                return (
                  <li key={t.tagId} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <TagDot color={tag?.color ?? 'slate'} />
                        {tag?.name ?? '(削除済み)'}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatHuman(t.total)}
                      </span>
                    </div>
                    <SplitBar focus={t.focus} brk={t.break} />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>集中 {formatHuman(t.focus)}</span>
                      <span>休憩 {formatHuman(t.break)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SplitBar({ focus, brk }: { focus: number; brk: number }) {
  const total = focus + brk || 1
  const fp = (focus / total) * 100
  const bp = (brk / total) * 100
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        style={{ width: `${fp}%`, backgroundColor: tagColorValue('green') }}
        className="h-full"
      />
      <div
        style={{ width: `${bp}%`, backgroundColor: tagColorValue('amber') }}
        className="h-full"
      />
    </div>
  )
}

function BigStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: 'focus' | 'break'
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5 py-1">
        <span
          className={cn(
            'flex items-center gap-1.5 text-xs',
            tone === 'focus'
              ? 'text-focus'
              : tone === 'break'
                ? 'text-break'
                : 'text-muted-foreground',
          )}
        >
          {icon}
          {label}
        </span>
        <span className="font-mono text-2xl font-semibold tabular-nums">
          {value}
        </span>
      </CardContent>
    </Card>
  )
}
