'use client'

import * as React from 'react'
import { Bell, ListPlus, LogOut, Tags, Timer } from 'lucide-react'
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
import { AlarmSettingsDialog } from '@/components/alarm-settings-dialog'
import { useAlarm } from '@/lib/alarm-context'
import { cn } from '@/lib/utils'

/** 認証状態に応じてログイン画面またはタブ付きアプリ画面を表示する Client Component です。 */
export function AppShell() {
  const {
    hydrated,
    dataReady,
    bootstrapError,
    authenticated,
    user,
    activeSession,
    logout,
  } = useStore()
  const { clearForLogout } = useAlarm()
  const [manualOpen, setManualOpen] = React.useState(false)
  const [tagsOpen, setTagsOpen] = React.useState(false)
  const [alarmSettingsOpen, setAlarmSettingsOpen] = React.useState(false)

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:py-10">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mx-auto aspect-square w-full max-w-sm rounded-xl" />
      </div>
    )
  }

  if (authenticated === null) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-4 px-4 py-6 sm:py-10">
        <div className="rounded-xl border bg-card p-6 text-center">
          <h1 className="font-semibold">接続を確認できません</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {bootstrapError ?? 'ログイン状態を確認できませんでした。'}
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </div>
      </div>
    )
  }

  if (authenticated === false) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-6 px-4 py-6 sm:py-10">
        <CardLogin />
      </div>
    )
  }

  if (!dataReady) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-4 px-4 py-6 sm:py-10">
        <div className="rounded-xl border bg-card p-6 text-center">
          <h1 className="font-semibold">タイマー情報を読み込めません</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {bootstrapError ?? 'データを再取得しています。'}
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </div>
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
            aria-label="アラーム設定"
            onClick={() => setAlarmSettingsOpen(true)}
          >
            <Bell />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="ログアウト"
            onClick={async () => {
              const result = await logout()
              if (!result.ok) toast.error(result.error)
              else clearForLogout()
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
      <AlarmSettingsDialog
        open={alarmSettingsOpen}
        onOpenChange={setAlarmSettingsOpen}
      />
    </div>
  )
}


/** Spring Boot の OAuth2 開始 URL へ移動するログインカードです。 */
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
