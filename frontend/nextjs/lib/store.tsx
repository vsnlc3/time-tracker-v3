'use client'

import * as React from 'react'
import {
  ApiRequestError,
  type ApiActivitySession,
  type ApiManualTimeEntry,
  type ApiSummary,
  type ApiUser,
  type SegmentType as ApiSegmentType,
  createManualTimeEntry,
  createTag,
  createTimedManualSession,
  deleteActivitySession,
  deleteManualTimeEntry,
  deleteSessionSegment,
  deleteTag as deleteTagApi,
  finishActivitySession,
  getActiveSession,
  getActivitySessions,
  getCsrfToken,
  getCurrentUser,
  getManualTimeEntries,
  getSummary,
  getTags,
  logout as logoutApi,
  startActivitySession,
  switchSessionSegment,
  updateActivitySession,
  updateSessionSegment,
  updateTag,
} from './api'
import type {
  AppState,
  ManualRecord,
  Segment,
  SegmentType,
  Session,
  Tag,
} from './types'
import { dateKey, rangesOverlap, timeStrToEpoch } from './time'

const EMPTY_STATE: AppState = { tags: [], sessions: [], manualRecords: [] }
const MINUTE_SECONDS = 60

export type Result = { ok: true } | { ok: false; error: string }
const ok: Result = { ok: true }
const fail = (error: string): Result => ({ ok: false, error })

export interface StartSessionInput {
  tagId: string
  initialType: SegmentType
  segmentPlannedMin: number | null
  sessionPlannedMin: number | null
}

export interface TimedRecordInput {
  tagId: string
  dayKey: string
  type: SegmentType
  startTime?: string
  endTime?: string
  totalMin?: number
}

interface StoreValue {
  hydrated: boolean
  authenticated: boolean | null
  user: ApiUser | null
  now: number
  state: AppState
  summary: ApiSummary | null
  activeSession: Session | null
  activeSegment: Segment | null
  startSession: (input: StartSessionInput) => Promise<Result>
  switchSegment: (nextPlannedMin: number | null) => Promise<Result>
  extendActiveSegment: (addMin: number) => Promise<Result>
  extendActiveSession: (addMin: number) => Promise<Result>
  endSession: () => Promise<Result>
  updateSessionTag: (sessionId: string, tagId: string) => Promise<Result>
  deleteSession: (sessionId: string) => Promise<Result>
  updateSegmentType: (sessionId: string, segId: string, type: SegmentType) => Promise<Result>
  updateSegmentStart: (sessionId: string, segId: string, start: number) => Promise<Result>
  updateSegmentEnd: (sessionId: string, segId: string, end: number) => Promise<Result>
  deleteSegment: (sessionId: string, segId: string) => Promise<Result>
  addTimedRecord: (input: TimedRecordInput) => Promise<Result>
  addUntimedRecord: (
    tagId: string,
    date: string,
    focusMin: number,
    breakMin: number,
  ) => Promise<Result>
  deleteManualRecord: (id: string) => Promise<Result>
  addTag: (name: string, color: string) => Promise<Result>
  renameTag: (id: string, name: string) => Promise<Result>
  updateTagColor: (id: string, color: string) => Promise<Result>
  deleteTag: (id: string) => Promise<Result>
  logout: () => Promise<Result>
}

const StoreContext = React.createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError && error.status === 401) {
    return 'ログイン状態が切れました。もう一度ログインしてください。'
  }
  if (error instanceof Error) return error.message
  return '予期しないエラーが発生しました。'
}

function toTag(tag: { id: number; displayName: string; color?: string | null }): Tag {
  return { id: String(tag.id), name: tag.displayName, color: tag.color || 'green' }
}

function toSession(session: ApiActivitySession): Session {
  return {
    id: String(session.id),
    tagId: String(session.tagId),
    activityDate: session.activityDate,
    start: new Date(session.startedAt).getTime(),
    end: session.endedAt ? new Date(session.endedAt).getTime() : null,
    plannedMin:
      session.plannedDurationSeconds == null
        ? null
        : session.plannedDurationSeconds / MINUTE_SECONDS,
    plannedEndAt: session.plannedEndAt ? new Date(session.plannedEndAt).getTime() : null,
    segments: session.segments.map((segment) => ({
      id: String(segment.id),
      type: segment.segmentType,
      start: new Date(segment.startedAt).getTime(),
      end: segment.endedAt ? new Date(segment.endedAt).getTime() : null,
      plannedMin:
        segment.plannedDurationSeconds == null
          ? null
          : segment.plannedDurationSeconds / MINUTE_SECONDS,
    })),
  }
}

function toManualRecord(entry: ApiManualTimeEntry): ManualRecord {
  return {
    id: String(entry.id),
    tagId: String(entry.tagId),
    date: entry.activityDate,
    totalMin: entry.totalSeconds / MINUTE_SECONDS,
    focusMin: entry.focusSeconds / MINUTE_SECONDS,
    breakMin: entry.breakSeconds / MINUTE_SECONDS,
  }
}

function iso(epoch: number) {
  return new Date(epoch).toISOString()
}

function secondsFromMinutes(minutes: number | null) {
  return minutes == null ? undefined : Math.round(minutes * MINUTE_SECONDS)
}

function sessionInput(
  session: Session,
  changes: Partial<Pick<Session, 'tagId' | 'start' | 'end' | 'plannedMin'>>,
) {
  const start = changes.start ?? session.start
  const end = changes.end === undefined ? session.end : changes.end
  const planned = secondsFromMinutes(changes.plannedMin ?? session.plannedMin)
  const plannedEndAt =
    planned == null && session.plannedEndAt != null ? iso(session.plannedEndAt) : undefined
  return {
    tagId: Number(changes.tagId ?? session.tagId),
    // activityDate is an explicit business date and must not be inferred
    // from a timestamp when editing a manually entered session.
    activityDate: session.activityDate,
    startedAt: iso(start),
    ...(end == null ? {} : { endedAt: iso(end) }),
    ...(planned == null ? {} : { plannedDurationSeconds: planned }),
    ...(plannedEndAt == null ? {} : { plannedEndAt }),
  }
}

function segmentInput(
  segment: Segment,
  changes: Partial<Pick<Segment, 'type' | 'start' | 'end' | 'plannedMin'>>,
) {
  const start = changes.start ?? segment.start
  const end = changes.end === undefined ? segment.end : changes.end
  const planned = secondsFromMinutes(changes.plannedMin ?? segment.plannedMin)
  return {
    segmentType: (changes.type ?? segment.type) as ApiSegmentType,
    startedAt: iso(start),
    ...(end == null ? {} : { endedAt: iso(end) }),
    ...(planned == null ? {} : { plannedDurationSeconds: planned }),
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(EMPTY_STATE)
  const [summary, setSummary] = React.useState<ApiSummary | null>(null)
  const [user, setUser] = React.useState<ApiUser | null>(null)
  const [authenticated, setAuthenticated] = React.useState<boolean | null>(null)
  const [hydrated, setHydrated] = React.useState(false)
  const [now, setNow] = React.useState(() => Date.now())

  const refreshAll = React.useCallback(async () => {
    const today = dateKey()
    const [tags, sessions, manualRecords, active, todaySummary] = await Promise.all([
      getTags(),
      getActivitySessions(),
      getManualTimeEntries(),
      getActiveSession(),
      getSummary(today),
    ])
    const mappedSessions = sessions.map(toSession)
    if (active && !mappedSessions.some((item) => item.id === String(active.id))) {
      mappedSessions.push(toSession(active))
    }
    setState({
      tags: tags.map(toTag),
      sessions: mappedSessions,
      manualRecords: manualRecords.map(toManualRecord),
    })
    setSummary(todaySummary)
  }, [])

  const handleFailure = React.useCallback((error: unknown): Result => {
    if (error instanceof ApiRequestError && error.status === 401) {
      setAuthenticated(false)
      setUser(null)
    }
    return fail(apiErrorMessage(error))
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        await getCsrfToken()
        const currentUser = await getCurrentUser()
        if (cancelled) return
        setUser(currentUser)
        setAuthenticated(true)
        await refreshAll()
      } catch {
        if (!cancelled) setAuthenticated(false)
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [refreshAll])

  React.useEffect(() => {
    if (!authenticated) return
    const id = window.setInterval(() => {
      void refreshAll().catch(handleFailure)
    }, 15000)
    return () => window.clearInterval(id)
  }, [authenticated, handleFailure, refreshAll])

  React.useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const activeSession = React.useMemo(
    () => state.sessions.find((session) => session.end === null) ?? null,
    [state.sessions],
  )
  const activeSegment = React.useMemo(
    () => activeSession?.segments.find((segment) => segment.end === null) ?? null,
    [activeSession],
  )

  const otherSessionsOverlap = React.useCallback(
    (start: number, end: number, ignoreId?: string) =>
      state.sessions.some(
        (session) =>
          session.id !== ignoreId &&
          session.end !== null &&
          rangesOverlap(start, end, session.start, session.end),
      ),
    [state.sessions],
  )

  const runMutation = React.useCallback(
    async (mutation: () => Promise<unknown>): Promise<Result> => {
      try {
        await mutation()
        await refreshAll()
        return ok
      } catch (error) {
        return handleFailure(error)
      }
    },
    [handleFailure, refreshAll],
  )

  const startSession = React.useCallback(
    (input: StartSessionInput) =>
      runMutation(() =>
        startActivitySession({
          tagId: Number(input.tagId),
          activityDate: dateKey(),
          initialSegmentType: input.initialType,
          ...(secondsFromMinutes(input.segmentPlannedMin) == null
            ? {}
            : { segmentPlannedDurationSeconds: secondsFromMinutes(input.segmentPlannedMin) }),
          ...(secondsFromMinutes(input.sessionPlannedMin) == null
            ? {}
            : { plannedDurationSeconds: secondsFromMinutes(input.sessionPlannedMin) }),
        }),
      ),
    [runMutation],
  )

  const switchSegment = React.useCallback(
    (nextPlannedMin: number | null) => {
      if (!activeSession || !activeSegment) return Promise.resolve(fail('進行中の区間がありません。'))
      const nextType: SegmentType = activeSegment.type === 'FOCUS' ? 'BREAK' : 'FOCUS'
      return runMutation(() =>
        switchSessionSegment(Number(activeSession.id), {
          segmentType: nextType,
          ...(secondsFromMinutes(nextPlannedMin) == null
            ? {}
            : { plannedDurationSeconds: secondsFromMinutes(nextPlannedMin) }),
        }),
      )
    },
    [activeSegment, activeSession, runMutation],
  )

  const extendActiveSegment = React.useCallback(
    (addMin: number) => {
      if (!activeSession || !activeSegment) return Promise.resolve(fail('進行中の区間がありません。'))
      const elapsedMin = Math.ceil((Date.now() - activeSegment.start) / 60000)
      const base = activeSegment.plannedMin ?? elapsedMin
      return runMutation(() =>
        updateSessionSegment(Number(activeSegment.id), segmentInput(activeSegment, { plannedMin: base + addMin })),
      )
    },
    [activeSegment, activeSession, runMutation],
  )

  const extendActiveSession = React.useCallback(
    (addMin: number) => {
      if (!activeSession) return Promise.resolve(fail('進行中のセッションがありません。'))
      const elapsedMin = Math.ceil((Date.now() - activeSession.start) / 60000)
      const base = activeSession.plannedMin ?? elapsedMin
      return runMutation(() =>
        updateActivitySession(
          Number(activeSession.id),
          sessionInput(activeSession, { plannedMin: base + addMin }),
        ),
      )
    },
    [activeSession, runMutation],
  )

  const endSession = React.useCallback(() => {
    if (!activeSession) return Promise.resolve(fail('進行中のセッションがありません。'))
    return runMutation(() => finishActivitySession(Number(activeSession.id)))
  }, [activeSession, runMutation])

  const updateSessionTag = React.useCallback(
    (sessionId: string, tagId: string) => {
      const session = state.sessions.find((item) => item.id === sessionId)
      if (!session) return Promise.resolve(fail('セッションが見つかりません。'))
      return runMutation(() => updateActivitySession(Number(sessionId), sessionInput(session, { tagId })))
    },
    [runMutation, state.sessions],
  )

  const deleteSession = React.useCallback(
    (sessionId: string) => runMutation(() => deleteActivitySession(Number(sessionId))),
    [runMutation],
  )

  const updateSegmentType = React.useCallback(
    (sessionId: string, segId: string, type: SegmentType) => {
      const session = state.sessions.find((item) => item.id === sessionId)
      const segment = session?.segments.find((item) => item.id === segId)
      if (!segment) return Promise.resolve(fail('区間が見つかりません。'))
      return runMutation(() => updateSessionSegment(Number(segId), segmentInput(segment, { type })))
    },
    [runMutation, state.sessions],
  )

  const updateSegmentStart = React.useCallback(
    (sessionId: string, segId: string, start: number) => {
      const session = state.sessions.find((item) => item.id === sessionId)
      const segment = session?.segments.find((item) => item.id === segId)
      if (!session || !segment) return Promise.resolve(fail('区間が見つかりません。'))
      if (!(start < (segment.end ?? session.end ?? Date.now()))) {
        return Promise.resolve(fail('開始は終了より前にしてください。'))
      }
      return runMutation(() => updateSessionSegment(Number(segId), segmentInput(segment, { start })))
    },
    [runMutation, state.sessions],
  )

  const updateSegmentEnd = React.useCallback(
    (sessionId: string, segId: string, end: number) => {
      const session = state.sessions.find((item) => item.id === sessionId)
      const segment = session?.segments.find((item) => item.id === segId)
      if (!session || !segment) return Promise.resolve(fail('区間が見つかりません。'))
      if (!(segment.start < end)) return Promise.resolve(fail('終了は開始より後にしてください。'))
      return runMutation(() => updateSessionSegment(Number(segId), segmentInput(segment, { end })))
    },
    [runMutation, state.sessions],
  )

  const deleteSegment = React.useCallback(
    (sessionId: string, segId: string) => {
      const session = state.sessions.find((item) => item.id === sessionId)
      if (!session) return Promise.resolve(fail('セッションが見つかりません。'))
      if (session.segments.length <= 1) {
        return Promise.resolve(fail('最後の区間は削除できません。セッションごと削除してください。'))
      }
      return runMutation(() => deleteSessionSegment(Number(segId)))
    },
    [runMutation, state.sessions],
  )

  const addTimedRecord = React.useCallback(
    (input: TimedRecordInput) => {
      const parse = (time: string) => timeStrToEpoch(input.dayKey, time)
      let start: number | null = null
      let end: number | null = null
      if (input.startTime && input.endTime) {
        start = parse(input.startTime)
        end = parse(input.endTime)
        if (end <= start) end += 24 * 60 * 60 * 1000
      } else if (input.startTime && input.totalMin != null) {
        start = parse(input.startTime)
        end = start + input.totalMin * 60_000
      } else if (input.endTime && input.totalMin != null) {
        end = parse(input.endTime)
        start = end - input.totalMin * 60_000
      } else {
        return Promise.resolve(fail('開始時刻・終了時刻・合計時間のうち2つを入力してください。'))
      }
      if (start == null || end == null || !(start < end)) {
        return Promise.resolve(fail('時刻の指定が正しくありません。'))
      }
      if (otherSessionsOverlap(start, end)) {
        return Promise.resolve(fail('既存のセッションと時間帯が重複します。'))
      }
      return runMutation(() =>
        createTimedManualSession({
          tagId: Number(input.tagId),
          activityDate: input.dayKey,
          segmentType: input.type,
          startedAt: iso(start as number),
          endedAt: iso(end as number),
        }),
      )
    },
    [otherSessionsOverlap, runMutation],
  )

  const addUntimedRecord = React.useCallback(
    (tagId: string, date: string, focusMin: number, breakMin: number) => {
      if (!Number.isFinite(focusMin) || !Number.isFinite(breakMin) || focusMin < 0 || breakMin < 0) {
        return Promise.resolve(fail('時間は0以上で入力してください。'))
      }
      if (focusMin + breakMin <= 0) return Promise.resolve(fail('合計時間が0です。'))
      return runMutation(() =>
        createManualTimeEntry({
          tagId: Number(tagId),
          activityDate: date,
          totalSeconds: Math.round((focusMin + breakMin) * MINUTE_SECONDS),
          focusSeconds: Math.round(focusMin * MINUTE_SECONDS),
          breakSeconds: Math.round(breakMin * MINUTE_SECONDS),
        }),
      )
    },
    [runMutation],
  )

  const deleteManualRecord = React.useCallback(
    (id: string) => runMutation(() => deleteManualTimeEntry(Number(id))),
    [runMutation],
  )

  const addTag = React.useCallback(
    (name: string, color: string) => {
      const trimmed = name.trim()
      if (!trimmed) return Promise.resolve(fail('タグ名を入力してください。'))
      if (state.tags.some((tag) => tag.name === trimmed)) {
        return Promise.resolve(fail('同じ名前のタグが既にあります。'))
      }
      return runMutation(() => createTag(trimmed, color))
    },
    [runMutation, state.tags],
  )

  const renameTag = React.useCallback(
    (id: string, name: string) => {
      const tag = state.tags.find((item) => item.id === id)
      const trimmed = name.trim()
      if (!tag) return Promise.resolve(fail('タグが見つかりません。'))
      if (!trimmed) return Promise.resolve(fail('タグ名を入力してください。'))
      if (state.tags.some((item) => item.id !== id && item.name === trimmed)) {
        return Promise.resolve(fail('同じ名前のタグが既にあります。'))
      }
      return runMutation(() => updateTag(Number(id), trimmed, tag.color))
    },
    [runMutation, state.tags],
  )

  const updateTagColor = React.useCallback(
    (id: string, color: string) => {
      const tag = state.tags.find((item) => item.id === id)
      if (!tag) return Promise.resolve(fail('タグが見つかりません。'))
      return runMutation(() => updateTag(Number(id), tag.name, color))
    },
    [runMutation, state.tags],
  )

  const deleteTag = React.useCallback(
    (id: string) => {
      if (
        state.sessions.some((session) => session.tagId === id) ||
        state.manualRecords.some((record) => record.tagId === id)
      ) {
        return Promise.resolve(fail('このタグは記録で使用中のため削除できません。'))
      }
      if (state.tags.length <= 1) return Promise.resolve(fail('タグは最低1つ必要です。'))
      return runMutation(() => deleteTagApi(Number(id)))
    },
    [runMutation, state.manualRecords, state.sessions, state.tags.length],
  )

  const logout = React.useCallback(async (): Promise<Result> => {
    try {
      await logoutApi()
      setAuthenticated(false)
      setUser(null)
      setState(EMPTY_STATE)
      setSummary(null)
      return ok
    } catch (error) {
      return handleFailure(error)
    }
  }, [handleFailure])

  const value: StoreValue = {
    hydrated,
    authenticated,
    user,
    now,
    state,
    summary,
    activeSession,
    activeSegment,
    startSession,
    switchSegment,
    extendActiveSegment,
    extendActiveSession,
    endSession,
    updateSessionTag,
    deleteSession,
    updateSegmentType,
    updateSegmentStart,
    updateSegmentEnd,
    deleteSegment,
    addTimedRecord,
    addUntimedRecord,
    deleteManualRecord,
    addTag,
    renameTag,
    updateTagColor,
    deleteTag,
    logout,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useTagMap(): Record<string, Tag> {
  const { state } = useStore()
  return React.useMemo(() => {
    const map: Record<string, Tag> = {}
    for (const tag of state.tags) map[tag.id] = tag
    return map
  }, [state.tags])
}
