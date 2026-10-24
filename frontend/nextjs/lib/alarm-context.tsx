'use client'

import * as React from 'react'
import { deriveAlarmDeadlines, type AlarmDeadline } from './alarm-events'
import { AlarmAudioEngine } from './alarm-audio'
import { useStore } from './store'

const STORAGE_KEY = 'time-tracker.alarm-state.v1'
const VOLUME_KEY = 'time-tracker.alarm-volume.v1'
const DEFAULT_VOLUME = 0.8

type NotificationAvailability = 'unsupported' | NotificationPermission

type PersistedAlarmState = {
  version: 1
  sessionId: string
  activeEvents: AlarmDeadline[]
  dismissedEventIds: string[]
}

type AlarmRuntime = {
  sessionId: string | null
  activeEvents: AlarmDeadline[]
  dismissedEventIds: string[]
  /** 音源との対応をProvider側で管理するイベントIDです。音声エンジンはIDを保持しません。 */
  scheduledEventId: string | null
  audioReady: boolean
  audioPreparing: boolean
  audioError: string | null
}

const EMPTY_RUNTIME: AlarmRuntime = {
  sessionId: null,
  activeEvents: [],
  dismissedEventIds: [],
  scheduledEventId: null,
  audioReady: false,
  audioPreparing: false,
  audioError: null,
}

type AlarmContextValue = {
  activeEvents: AlarmDeadline[]
  audioReady: boolean
  audioPreparing: boolean
  audioError: string | null
  volume: number
  setVolume: (volume: number) => void
  prepareAudio: () => Promise<void>
  playTestSound: () => Promise<void>
  stopAlarm: () => void
  clearForLogout: () => void
  notificationAvailability: NotificationAvailability
  notificationError: string | null
  requestNotificationPermission: () => Promise<void>
}

const AlarmContext = React.createContext<AlarmContextValue | null>(null)

export function useAlarm() {
  const context = React.useContext(AlarmContext)
  if (!context) throw new Error('useAlarm must be used within AlarmProvider')
  return context
}

function readPersistedState(sessionId: string): PersistedAlarmState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedAlarmState>
    if (
      parsed.version !== 1 ||
      parsed.sessionId !== sessionId ||
      !Array.isArray(parsed.activeEvents) ||
      !Array.isArray(parsed.dismissedEventIds)
    ) {
      return null
    }
    return {
      version: 1,
      sessionId,
      activeEvents: parsed.activeEvents.filter(
        (event): event is AlarmDeadline =>
          typeof event === 'object' &&
          event !== null &&
          'id' in event &&
          'dueAt' in event &&
          'label' in event &&
          typeof event.id === 'string' &&
          typeof event.dueAt === 'number' &&
          typeof event.label === 'string' &&
          event.sessionId === sessionId,
      ),
      dismissedEventIds: parsed.dismissedEventIds.filter(
        (eventId): eventId is string => typeof eventId === 'string',
      ),
    }
  } catch {
    return null
  }
}

function persistRuntime(runtime: AlarmRuntime) {
  if (!runtime.sessionId) return
  const value: PersistedAlarmState = {
    version: 1,
    sessionId: runtime.sessionId,
    activeEvents: runtime.activeEvents,
    dismissedEventIds: runtime.dismissedEventIds,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage無効時はページ内の状態だけで継続します。
  }
}

function clearPersistedState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage無効時はメモリ状態だけを破棄します。
  }
}

function readSavedVolume() {
  try {
    const parsed = Number(window.localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : DEFAULT_VOLUME
  } catch {
    return DEFAULT_VOLUME
  }
}

function eventLabel(event: AlarmDeadline) {
  return event.label
}

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const {
    activeSession,
    activeSegment,
    dataReady,
    now,
  } = useStore()
  const [runtime, setRuntime] = React.useState(EMPTY_RUNTIME)
  const runtimeRef = React.useRef(runtime)
  const plansRef = React.useRef<AlarmDeadline[]>([])
  const engineRef = React.useRef<AlarmAudioEngine | null>(null)
  const reconcileRef = React.useRef<() => void>(() => undefined)
  const notifiedEventIds = React.useRef(new Set<string>())
  const [volume, setVolumeState] = React.useState(DEFAULT_VOLUME)
  const [notificationAvailability, setNotificationAvailability] =
    React.useState<NotificationAvailability>('unsupported')
  const [notificationError, setNotificationError] = React.useState<string | null>(null)

  const commitRuntime = React.useCallback((next: AlarmRuntime, persist = true) => {
    runtimeRef.current = next
    setRuntime(next)
    if (persist) persistRuntime(next)
  }, [])

  const getEngine = React.useCallback(() => {
    if (!engineRef.current) {
      const engine = new AlarmAudioEngine()
      engine.setStateChangeHandler((state) => {
        const current = runtimeRef.current
        if (state === 'running') {
          engine.stopAlarm()
          commitRuntime(
            {
              ...runtimeRef.current,
              audioReady: true,
              audioPreparing: false,
              audioError: null,
              scheduledEventId: null,
            },
          )
          window.setTimeout(() => reconcileRef.current(), 0)
        } else if (state === 'suspended') {
          engine.stopAlarm()
          commitRuntime({
            ...current,
            audioReady: false,
            audioPreparing: false,
            audioError: current.sessionId
              ? 'ブラウザが音声を一時停止しました。音声を再有効化してください。'
              : null,
            scheduledEventId: null,
          })
        }
      })
      engineRef.current = engine
    }
    return engineRef.current
  }, [commitRuntime])

  const setAudioFailure = React.useCallback(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : '音声を再生できませんでした。'
      commitRuntime({
        ...runtimeRef.current,
        audioReady: false,
        audioPreparing: false,
        audioError: message,
        scheduledEventId: null,
      })
    },
    [commitRuntime],
  )

  const notifyReached = React.useCallback((events: AlarmDeadline[]) => {
    const freshEvents = events.filter((event) => !notifiedEventIds.current.has(event.id))
    if (freshEvents.length === 0) return
    freshEvents.forEach((event) => notifiedEventIds.current.add(event.id))
    const labels = [...new Set(freshEvents.map(eventLabel))]
    const reason = labels.join('、')

    if (
      typeof document !== 'undefined' &&
      document.hidden &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const notification = new Notification('Time Tracker', {
          body: `${reason}に到達しました`,
          tag: `time-tracker-alarm-${freshEvents[0].sessionId}-${freshEvents[0].dueAt}`,
        })
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch {
        // 通知表示の失敗は音声とアプリ内UIに影響させません。
      }
    }
  }, [])

  const scheduleAudioForRuntime = React.useCallback(
    (deadlines: AlarmDeadline[], currentTime: number) => {
      const current = runtimeRef.current
      const engine = engineRef.current

      if (current.activeEvents.length > 0) {
        if (!current.audioReady || !engine) {
          if (!current.audioError) {
            commitRuntime({
              ...current,
              audioError: '音声を有効化するとアラームを再生できます。',
            })
          }
          return
        }
        const sourceHasReachedStart =
          engine.hasAlarmSource &&
          engine.scheduledStartAt != null &&
          engine.scheduledStartAt <= engine.currentTime
        // 予約源がすでに始まっているならそのループを保ち、未来開始なら今すぐ鳴らし直します。
        if (sourceHasReachedStart) return
        try {
          engine.scheduleAlarm(currentTime)
          commitRuntime({ ...current, scheduledEventId: null, audioError: null })
        } catch (error) {
          setAudioFailure(error)
        }
        return
      }

      const dismissed = new Set(current.dismissedEventIds)
      const next = deadlines.find(
        (event) => event.dueAt > currentTime && !dismissed.has(event.id),
      )
      if (!next) {
        engine?.stopAlarm()
        if (current.scheduledEventId !== null) {
          commitRuntime({ ...current, scheduledEventId: null })
        }
        return
      }
      if (!current.audioReady || !engine) return
      if (current.scheduledEventId === next.id && engine.hasAlarmSource) return

      try {
        engine.scheduleAlarm(next.dueAt)
        commitRuntime({ ...current, scheduledEventId: next.id, audioError: null })
      } catch (error) {
        setAudioFailure(error)
      }
    },
    [commitRuntime, setAudioFailure],
  )

  const reconcile = React.useCallback(() => {
    // dataReadyは成功したStoreスナップショットの有無です。通信失敗時はStoreが
    // 以前のセッションを保持するため、未取得状態を「セッション終了」と解釈しません。
    if (!dataReady) return

    const currentSessionId = activeSession?.id ?? null
    if (!currentSessionId) {
      const current = runtimeRef.current
      if (current.sessionId || current.activeEvents.length > 0 || current.scheduledEventId) {
        engineRef.current?.stopAlarm()
        engineRef.current?.close()
        clearPersistedState()
        notifiedEventIds.current.clear()
        commitRuntime({ ...EMPTY_RUNTIME, audioReady: false })
      } else {
        // 初回読み込み時に終了済みセッションの保存状態だけが残っていた場合も破棄します。
        clearPersistedState()
      }
      plansRef.current = []
      return
    }

    const deadlines = deriveAlarmDeadlines(activeSession, activeSegment)
    const currentTime = Date.now()
    let current = runtimeRef.current
    const isNewSession = current.sessionId !== currentSessionId
    const previousPlans = isNewSession ? [] : plansRef.current

    if (isNewSession) {
      engineRef.current?.stopAlarm()
      const restored = readPersistedState(currentSessionId)
      const engineIsReady = engineRef.current?.state === 'running'
      current = {
        ...EMPTY_RUNTIME,
        sessionId: currentSessionId,
        activeEvents: restored?.activeEvents ?? [],
        dismissedEventIds: restored?.dismissedEventIds ?? [],
        audioReady: engineIsReady,
        audioError: engineIsReady ? null : null,
      }
      notifiedEventIds.current.clear()
      plansRef.current = []
    }

    const dismissed = new Set(current.dismissedEventIds)
    const activeById = new Map(current.activeEvents.map((event) => [event.id, event]))
    // 先照合上一版计划，避免延長・切替が期限到達直後に起きた場合に旧イベントを取りこぼしません。
    const dueCandidates = new Map(
      [...previousPlans, ...deadlines].map((event) => [event.id, event]),
    )
    const dueEvents = [...dueCandidates.values()].filter(
      (event) =>
        event.dueAt <= currentTime &&
        !dismissed.has(event.id) &&
        !activeById.has(event.id),
    )
    for (const event of dueEvents) activeById.set(event.id, event)

    const activeEvents = [...activeById.values()].sort(
      (a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id),
    )
    const validCurrentIds = new Set(deadlines.map((event) => event.id))
    // 期限前に予定が変更された古い予約だけを除去します。鳴動中の理由は保持します。
    const stillPlanned = deadlines
    let scheduledEventId = current.scheduledEventId
    if (scheduledEventId && !validCurrentIds.has(scheduledEventId)) {
      const oldScheduledEvent = previousPlans.find((event) => event.id === scheduledEventId)
      if (!oldScheduledEvent || oldScheduledEvent.dueAt > currentTime) {
        engineRef.current?.stopAlarm()
        scheduledEventId = null
      }
    }

    const previousRuntime = runtimeRef.current
    const activeEventsChanged =
      activeEvents.length !== previousRuntime.activeEvents.length ||
      activeEvents.some((event, index) => event.id !== previousRuntime.activeEvents[index]?.id)
    current = {
      ...current,
      sessionId: currentSessionId,
      activeEvents,
      scheduledEventId,
      audioError: current.audioReady ? null : current.audioError,
    }
    if (
      isNewSession ||
      dueEvents.length > 0 ||
      activeEventsChanged ||
      scheduledEventId !== previousRuntime.scheduledEventId ||
      current.audioError !== previousRuntime.audioError
    ) {
      commitRuntime(current)
    }
    plansRef.current = stillPlanned
    if (dueEvents.length > 0) notifyReached(dueEvents)
    scheduleAudioForRuntime(deadlines, currentTime)
  }, [
    activeSegment,
    activeSession,
    commitRuntime,
    dataReady,
    notifyReached,
    scheduleAudioForRuntime,
  ])

  React.useEffect(() => {
    reconcileRef.current = reconcile
  }, [reconcile])

  React.useEffect(() => {
    reconcile()
  }, [reconcile, now])

  React.useEffect(() => {
    const onVisibilityChange = () => reconcileRef.current()
    const onPageShow = () => reconcileRef.current()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  React.useEffect(() => {
    setVolumeState(readSavedVolume())
    if ('Notification' in window) {
      setNotificationAvailability(Notification.permission)
    } else {
      setNotificationAvailability('unsupported')
    }
  }, [])

  React.useEffect(() => {
    engineRef.current?.setVolume(volume)
    try {
      window.localStorage.setItem(VOLUME_KEY, String(volume))
    } catch {
      // 設定を永続化できない場合も現在のページでは反映します。
    }
  }, [volume])

  React.useEffect(
    () => () => {
      void engineRef.current?.close()
    },
    [],
  )

  const prepareAudio = React.useCallback(async () => {
    commitRuntime({ ...runtimeRef.current, audioPreparing: true, audioError: null })
    try {
      const engine = getEngine()
      engine.setVolume(volume)
      await engine.prepare()
      commitRuntime({
        ...runtimeRef.current,
        audioReady: true,
        audioPreparing: false,
        audioError: null,
      })
      reconcileRef.current()
    } catch (error) {
      setAudioFailure(error)
    }
  }, [commitRuntime, getEngine, setAudioFailure, volume])

  const playTestSound = React.useCallback(async () => {
    reconcileRef.current()
    if (runtimeRef.current.activeEvents.length > 0) return
    try {
      const engine = getEngine()
      engine.setVolume(volume)
      if (engine.state !== 'running') await engine.prepare()
      reconcileRef.current()
      if (runtimeRef.current.activeEvents.length > 0) return
      engine.playPreview()
      commitRuntime({
        ...runtimeRef.current,
        audioReady: true,
        audioPreparing: false,
        audioError: null,
      })
      reconcileRef.current()
    } catch (error) {
      setAudioFailure(error)
    }
  }, [commitRuntime, getEngine, setAudioFailure, volume])

  const stopAlarm = React.useCallback(() => {
    const current = runtimeRef.current
    if (!current.sessionId) return
    const currentTime = Date.now()
    const dismissed = new Set(current.dismissedEventIds)
    const currentDeadlines = deriveAlarmDeadlines(activeSession, activeSegment)
    const dueNowById = new Map(
      [...plansRef.current, ...currentDeadlines]
        .filter((event) => event.dueAt <= currentTime)
        .map((event) => [event.id, event]),
    )
    const acknowledgedIds = [
      ...current.activeEvents.map((event) => event.id),
      ...dueNowById.keys(),
    ]
    acknowledgedIds.forEach((id) => dismissed.add(id))
    engineRef.current?.stopAlarm()
    const next: AlarmRuntime = {
      ...current,
      activeEvents: [],
      dismissedEventIds: [...dismissed],
      scheduledEventId: null,
      audioError: null,
    }
    commitRuntime(next)
    reconcileRef.current()
  }, [activeSegment, activeSession, commitRuntime])

  const clearForLogout = React.useCallback(() => {
    engineRef.current?.stopAlarm()
    engineRef.current?.close()
    // ログアウトでは再生を止めますが、同じセッションへ戻った場合に備え既読状態は保存します。
    commitRuntime({ ...EMPTY_RUNTIME, audioReady: false }, false)
    plansRef.current = []
  }, [commitRuntime])

  const setVolume = React.useCallback((nextVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, nextVolume)))
  }, [])

  const requestNotificationPermission = React.useCallback(async () => {
    setNotificationError(null)
    if (!('Notification' in window)) {
      setNotificationAvailability('unsupported')
      setNotificationError('このブラウザはOS通知に対応していません。')
      return
    }
    if (!window.isSecureContext) {
      setNotificationError('OS通知を使うにはHTTPSでアプリを開いてください。')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      setNotificationAvailability(permission)
      if (permission === 'denied') setNotificationError('ブラウザ設定で通知が拒否されています。')
    } catch {
      setNotificationError('通知の許可を確認できませんでした。')
    }
  }, [])

  const value = React.useMemo<AlarmContextValue>(
    () => ({
      activeEvents: runtime.activeEvents,
      audioReady: runtime.audioReady,
      audioPreparing: runtime.audioPreparing,
      audioError: runtime.audioError,
      volume,
      setVolume,
      prepareAudio,
      playTestSound,
      stopAlarm,
      clearForLogout,
      notificationAvailability,
      notificationError,
      requestNotificationPermission,
    }),
    [
      clearForLogout,
      notificationAvailability,
      notificationError,
      playTestSound,
      prepareAudio,
      requestNotificationPermission,
      runtime.activeEvents,
      runtime.audioError,
      runtime.audioPreparing,
      runtime.audioReady,
      setVolume,
      stopAlarm,
      volume,
    ],
  )

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>
}

