import type { Segment, Session } from './types'

export type AlarmDeadline = {
  id: string
  sessionId: string
  dueAt: number
  kind: 'segment' | 'session'
  segmentType?: Segment['type']
  label: string
}

function segmentLabel(type: Segment['type']) {
  return type === 'FOCUS' ? 'FOCUS の予定時間' : 'BREAK の予定時間'
}

/** 現在の進行中セッションから、まだ有効な期限イベントを導出します。 */
export function deriveAlarmDeadlines(
  session: Session | null,
  segment: Segment | null,
): AlarmDeadline[] {
  if (!session || session.end !== null) return []

  const deadlines: AlarmDeadline[] = []
  if (segment && segment.end === null && segment.plannedMin != null && segment.plannedMin > 0) {
    const dueAt = segment.start + segment.plannedMin * 60_000
    if (Number.isFinite(dueAt)) {
      deadlines.push({
        id: `segment:${session.id}:${segment.id}:${dueAt}`,
        sessionId: session.id,
        dueAt,
        kind: 'segment',
        segmentType: segment.type,
        label: segmentLabel(segment.type),
      })
    }
  }

  const sessionDueAt =
    session.plannedEndAt ??
    (session.plannedMin != null && session.plannedMin > 0
      ? session.start + session.plannedMin * 60_000
      : null)
  if (sessionDueAt != null && Number.isFinite(sessionDueAt)) {
    deadlines.push({
      id: `session:${session.id}:${sessionDueAt}`,
      sessionId: session.id,
      dueAt: sessionDueAt,
      kind: 'session',
      label: 'セッション全体の予定時間',
    })
  }

  return deadlines.sort((a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id))
}

