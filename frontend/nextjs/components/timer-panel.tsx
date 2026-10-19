'use client'

import { useStore } from '@/lib/store'
import { StartForm } from '@/components/start-form'
import { ActiveSession } from '@/components/active-session'

/** 進行中セッションの有無に応じて、計測中表示か開始フォームを選びます。 */
export function TimerPanel() {
  const { activeSession } = useStore()
  return (
    <div className="mx-auto w-full max-w-lg">
      {activeSession ? <ActiveSession /> : <StartForm />}
    </div>
  )
}
