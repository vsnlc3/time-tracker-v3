'use client'

import * as React from 'react'
import { ListPlus, LogOut, Tags, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/lib/store'
import { TimerPanel } from '@/components/timer-panel'
import { TodaySummary } from '@/components/today-summary'
import { RecordsView } from '@/components/records-view'
import { ManualEntryDialog } from '@/components/manual-entry-dialog'
import { TagsDialog } from '@/components/tags-dialog'
import { cn } from '@/lib/utils'

function playChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const notes = [880, 1174.66]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.4)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    // audio not available
  }
}

function useReachedNotifications() {
  const { activeSession, activeSegment, now } = useStore()
  const fired = React.useRef<Set<string>>(new Set())

  React.useEffect(() => {
    if (activeSegment?.plannedMin) {
      const key = `${activeSegment.id}:${activeSegment.plannedMin}`
      const elapsed = now - activeSegment.start
      if (elapsed >= activeSegment.plannedMin * 60_000 && !fired.current.has(key)) {
        fired.current.add(key)
        playChime()
        toast(
          activeSegment.type === 'FOCUS'
            ? 'FOCUS の予定時間に到達しました'
            : 'BREAK の予定時間に到達しました',
          { description: '継続・延長・状態の切り替えを選べます。' },
        )
      }
    }
    if (activeSession?.plannedMin) {
      const key = `${activeSession.id}:sess:${activeSession.plannedMin}`
      const elapsed = now - activeSession.start
      if (elapsed >= activeSession.plannedMin * 60_000 && !fired.current.has(key)) {
        fired.current.add(key)
        playChime()
        toast('セッションの予定時間に到達しました', {
          description: 'お疲れさまでした。区切りをつけましょう。',
        })
      }
    }
  }, [now, activeSegment, activeSession])
}

export function AppShell() {
  const { hydrated, authenticated, user, activeSession, logout } = useStore()
  const [manualOpen, setManualOpen] = React.useState(false)
  const [tagsOpen, setTagsOpen] = React.useState(false)
  useReachedNotifications()

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:py-10">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mx-auto aspect-square w-full max-w-sm rounded-xl" />
      </div>
    )
  }

  if (authenticated !== true) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-6 px-4 py-6 sm:py-10">
        <CardLogin />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Timer className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold">Cadence</span>
            <span className="text-xs text-muted-foreground">
              フォーカスタイムトラッカー
            </span>
          </div>
          {activeSession && (
            <span className="ml-1 flex items-center gap-1.5 rounded-full bg-focus-muted px-2 py-0.5 text-xs font-medium text-focus">
              <span className="size-1.5 animate-pulse rounded-full bg-focus" />
              計測中
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden max-w-32 truncate text-xs text-muted-foreground sm:inline">
            {user?.displayName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="ログアウト"
            onClick={async () => {
              const result = await logout()
              if (!result.ok) toast.error(result.error)
            }}
          >
            <LogOut />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManualOpen(true)}
          >
            <ListPlus data-icon="inline-start" />
            <span className="hidden sm:inline">手動入力</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="タグを管理"
            onClick={() => setTagsOpen(true)}
          >
            <Tags />
          </Button>
        </div>
      </header>

      {!hydrated ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mx-auto aspect-square w-full max-w-sm rounded-xl" />
        </div>
      ) : (
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className={cn('w-full *:flex-1')}>
            <TabsTrigger value="timer">タイマー</TabsTrigger>
            <TabsTrigger value="summary">サマリー</TabsTrigger>
            <TabsTrigger value="records">記録</TabsTrigger>
          </TabsList>
          <TabsContent value="timer" className="pt-2">
            <TimerPanel />
          </TabsContent>
          <TabsContent value="summary" className="pt-2">
            <TodaySummary />
          </TabsContent>
          <TabsContent value="records" className="pt-2">
            <RecordsView />
          </TabsContent>
        </Tabs>
      )}

      <ManualEntryDialog open={manualOpen} onOpenChange={setManualOpen} />
      <TagsDialog open={tagsOpen} onOpenChange={setTagsOpen} />
    </div>
  )
}

function CardLogin() {
  return (
    <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Timer className="size-6" />
      </span>
      <h1 className="mt-5 text-xl font-semibold">Cadence</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Googleアカウントでログインして、活動時間を記録しましょう。
      </p>
      <Button
        render={<a href="/spring-auth/oauth2/authorization/google" />}
        nativeButton={false}
        className="mt-6"
      >
        Googleでログイン
      </Button>
    </div>
  )
}
