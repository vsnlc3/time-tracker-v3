import { StoreProvider } from '@/lib/store'
import { AppShell } from '@/components/app-shell'

/** 画面全体をクライアント状態の Provider で包む、アプリのルートページです。 */
export default function Page() {
  return (
    <StoreProvider>
      <main>
        <AppShell />
      </main>
    </StoreProvider>
  )
}
