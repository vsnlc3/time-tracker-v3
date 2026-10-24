import { StoreProvider } from '@/lib/store'
import { AlarmProvider } from '@/lib/alarm-context'
import { AppShell } from '@/components/app-shell'
import { AlarmBanner } from '@/components/alarm-banner'

/** 画面全体をクライアント状態の Provider で包む、アプリのルートページです。 */
export default function Page() {
  return (
    <StoreProvider>
      <AlarmProvider>
        <AlarmBanner />
        <main>
          <AppShell />
        </main>
      </AlarmProvider>
    </StoreProvider>
  )
}
