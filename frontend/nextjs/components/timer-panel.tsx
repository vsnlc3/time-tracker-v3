'use client'

import { useStore } from '@/lib/store'
import { StartForm } from '@/components/start-form'
import { ActiveSession } from '@/components/active-session'

export function TimerPanel() {
  const { activeSession } = useStore()
  return (
    <div className="mx-auto w-full max-w-lg">
      {activeSession ? <ActiveSession /> : <StartForm />}
    </div>
  )
}
