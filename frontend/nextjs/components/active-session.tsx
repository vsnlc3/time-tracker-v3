'use client'

import * as React from 'react'
import {
  Brain,
  ChevronDown,
  Coffee,
  Hourglass,
  Plus,
  Square,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { TimerRing } from '@/components/timer-ring'
import { TagBadge } from '@/components/tag-badge'
import { SessionTimeline } from '@/components/session-timeline'
import { useStore, useTagMap } from '@/lib/store'
import {
  breakMs,
  focusMs,
  formatClock,
  formatDigital,
  formatHuman,
  segmentDuration,
  sessionDuration,
} from '@/lib/time'
import { cn } from '@/lib/utils'

const DEFAULT_NEXT = { FOCUS: 25, BREAK: 5 } as const

export function ActiveSession() {
  const {
    now,
    activeSession,
    activeSegment,
    switchSegment,
    extendActiveSegment,
    extendActiveSession,
    endSession,
  } = useStore()
  const tagMap = useTagMap()

  if (!activeSession || !activeSegment) return null

  const isFocus = activeSegment.type === 'FOCUS'
  const variant = isFocus ? 'focus' : 'break'
  const segElapsed = segmentDuration(activeSegment, now)
  const plannedMs = activeSegment.plannedMin
    ? activeSegment.plannedMin * 60_000
    : null
  const progress = plannedMs ? segElapsed / plannedMs : 0
  const overtime = plannedMs != null && segElapsed > plannedMs
  const remaining = plannedMs ? plannedMs - segElapsed : 0

  const nextType = isFocus ? 'BREAK' : 'FOCUS'
  const nextDefault = DEFAULT_NEXT[nextType]

  const sessTotal = sessionDuration(activeSession, now)
  const sessPlannedMs = activeSession.plannedMin
    ? activeSession.plannedMin * 60_000
    : null
  const sessOvertime = sessPlannedMs != null && sessTotal > sessPlannedMs

  async function handleSwitch() {
    const res = await switchSegment(nextDefault)
    if (!res.ok) toast.error(res.error)
    else {
      toast.success(
        nextType === 'BREAK'
          ? '休憩に入りました。'
          : '集中を再開しました。',
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        className={cn(
          'overflow-hidden border-transparent',
          isFocus ? 'bg-focus-muted/30' : 'bg-break-muted/30',
        )}
      >
        <CardContent className="flex flex-col items-center gap-6 pt-2">
          {/* session meta */}
          <div className="flex w-full items-center justify-between text-sm">
            <TagBadge tag={tagMap[activeSession.tagId]} />
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              開始 {formatClock(activeSession.start)}
            </span>
          </div>

          {/* ring */}
          <TimerRing
            progress={progress}
            variant={variant}
            indeterminate={plannedMs == null}
            overtime={overtime}
          >
            <span
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase',
                isFocus ? 'text-focus' : 'text-break',
              )}
            >
              {isFocus ? (
                <Brain className="size-3.5" />
              ) : (
                <Coffee className="size-3.5" />
              )}
              {activeSegment.type}
            </span>
            <span className="font-mono text-5xl font-semibold tabular-nums">
              {formatDigital(segElapsed)}
            </span>
            {plannedMs != null ? (
              <span
                className={cn(
                  'font-mono text-sm tabular-nums',
                  overtime ? 'text-break' : 'text-muted-foreground',
                )}
              >
                {overtime
                  ? `+${formatDigital(segElapsed - plannedMs)} 超過`
                  : `残り ${formatDigital(remaining)}`}
              </span>
            ) : (
              <span className="font-mono text-sm text-muted-foreground">
                予定なし
              </span>
            )}
          </TimerRing>

          {overtime && (
            <p className="text-center text-sm text-break">
              予定していた {activeSegment.plannedMin} 分に到達しました。継続・延長・切り替えを選べます。
            </p>
          )}

          {/* actions */}
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button
              size="lg"
              onClick={handleSwitch}
              className={cn(
                'sm:col-span-2',
                isFocus
                  ? 'bg-break text-break-foreground hover:bg-break/90'
                  : 'bg-focus text-focus-foreground hover:bg-focus/90',
              )}
            >
              {isFocus ? (
                <Coffee data-icon="inline-start" />
              ) : (
                <Brain data-icon="inline-start" />
              )}
              {isFocus
                ? `休憩に入る（${nextDefault}分）`
                : `集中を再開（${nextDefault}分）`}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="lg">
                    <Plus data-icon="inline-start" />
                    予定を延長
                    <ChevronDown data-icon="inline-end" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  {[5, 10, 15, 25].map((m) => (
                    <DropdownMenuItem
                      key={m}
                      onClick={async () => {
                        const res = await extendActiveSegment(m)
                        if (!res.ok) toast.error(res.error)
                        else toast.success(`現在の区間を +${m}分 延長しました。`)
                      }}
                    >
                      現在の区間を +{m}分
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={async () => {
                      const res = await extendActiveSession(15)
                      if (!res.ok) toast.error(res.error)
                      else toast.success('セッション予定を +15分 延長しました。')
                    }}
                  >
                    セッション予定を +15分
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="outline" size="lg">
                    <Square data-icon="inline-start" />
                    セッションを終了
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>セッションを終了しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    合計 {formatHuman(sessTotal)} を記録して終了します。この操作は元に戻せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const res = await endSession()
                      if (!res.ok) toast.error(res.error)
                      else toast.success('セッションを終了しました。')
                    }}
                  >
                    終了する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* live session stats */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="経過" value={formatHuman(sessTotal)} />
            <Stat
              label="FOCUS"
              value={formatHuman(focusMs(activeSession, now))}
              tone="focus"
            />
            <Stat
              label="BREAK"
              value={formatHuman(breakMs(activeSession, now))}
              tone="break"
            />
          </div>
          {sessPlannedMs != null && (
            <p
              className={cn(
                'flex items-center justify-center gap-1.5 text-xs',
                sessOvertime ? 'text-break' : 'text-muted-foreground',
              )}
            >
              <Hourglass className="size-3.5" />
              セッション予定 {activeSession.plannedMin}分
              {sessOvertime
                ? `（+${formatHuman(sessTotal - sessPlannedMs)} 超過）`
                : `（残り ${formatHuman(sessPlannedMs - sessTotal)}）`}
            </p>
          )}
          <Separator />
          <SessionTimeline session={activeSession} now={now} />
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'focus' | 'break'
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-mono text-lg font-semibold tabular-nums',
          tone === 'focus' && 'text-focus',
          tone === 'break' && 'text-break',
        )}
      >
        {value}
      </span>
    </div>
  )
}
