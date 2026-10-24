'use client'

import { AlarmClock, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAlarm } from '@/lib/alarm-context'
import { useStore } from '@/lib/store'

/** アラーム停止と音声再有効化を全画面から操作できる共通バーです。 */
export function AlarmBanner() {
  const { activeSession } = useStore()
  const {
    activeEvents,
    audioReady,
    audioPreparing,
    audioError,
    prepareAudio,
    stopAlarm,
  } = useAlarm()
  const ringing = activeEvents.length > 0
  const needsEnable = Boolean(activeSession) && !audioReady
  if (!ringing && !needsEnable) return null

  const reasons = [...new Set(activeEvents.map((event) => event.label))]

  return (
    <section
      role={ringing ? 'alert' : 'status'}
      aria-live={ringing ? 'assertive' : 'polite'}
      className={`sticky top-2 z-40 mx-auto mb-4 flex w-[calc(100%-2rem)] max-w-2xl flex-col gap-3 rounded-xl border p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between ${ringing ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-50'}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlarmClock className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">
            {ringing ? '予定時間に到達しました' : 'タイマー音声が有効ではありません'}
          </p>
          {ringing ? (
            <p className="mt-1 text-sm opacity-90">{reasons.join('・')}</p>
          ) : (
            <p className="mt-1 text-sm opacity-90">
              ページ再読み込み後も音を鳴らすには、音声を有効化してください。
            </p>
          )}
          {audioError && (
            <p className="mt-1 text-sm opacity-90">{audioError}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-2 sm:justify-end">
        {needsEnable && (
          <Button
            variant={ringing ? 'secondary' : 'default'}
            onClick={() => void prepareAudio()}
            disabled={audioPreparing}
          >
            <Volume2 data-icon="inline-start" />
            {audioPreparing ? '準備中…' : '音声を有効化'}
          </Button>
        )}
        {ringing && (
          <Button variant="secondary" onClick={stopAlarm}>
            アラーム停止
          </Button>
        )}
      </div>
    </section>
  )
}

