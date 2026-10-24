'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAlarm } from '@/lib/alarm-context'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AlarmSettingsDialog({ open, onOpenChange }: Props) {
  const {
    activeEvents,
    audioReady,
    audioPreparing,
    audioError,
    volume,
    setVolume,
    prepareAudio,
    playTestSound,
    notificationAvailability,
    notificationError,
    requestNotificationPermission,
  } = useAlarm()

  const permissionText = {
    unsupported: 'このブラウザではOS通知を利用できません。',
    default: 'OS通知はまだ許可されていません。',
    granted: 'OS通知は許可されています。',
    denied: 'OS通知は拒否されています。ブラウザ設定から変更できます。',
  }[notificationAvailability]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>アラーム設定</DialogTitle>
          <DialogDescription>
            音量とブラウザ通知を設定します。OSの音量やミュート状態は変更しません。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="alarm-volume" className="font-medium">アラーム音量</label>
              <span className="font-mono text-sm tabular-nums">{Math.round(volume * 100)}%</span>
            </div>
            <input
              id="alarm-volume"
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
              className="w-full accent-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {!audioReady && (
              <Button onClick={() => void prepareAudio()} disabled={audioPreparing}>
                {audioPreparing ? '準備中…' : '音声を有効化'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => void playTestSound()}
              disabled={activeEvents.length > 0}
            >
              テスト音
            </Button>
          </div>
          {activeEvents.length > 0 && (
            <p className="text-sm text-muted-foreground">
              アラーム鳴動中は、アラーム音を妨げないようテスト音を停止しています。
            </p>
          )}
          {audioError && <p role="status" className="text-sm text-destructive">{audioError}</p>}

          <div className="space-y-2 border-t pt-4">
            <p className="font-medium">OS通知</p>
            <p className="text-sm text-muted-foreground">{permissionText}</p>
            {notificationAvailability === 'default' && (
              <Button
                variant="outline"
                onClick={() => void requestNotificationPermission()}
              >
                OS通知を有効にする
              </Button>
            )}
            {notificationError && (
              <p role="status" className="text-sm text-destructive">{notificationError}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

