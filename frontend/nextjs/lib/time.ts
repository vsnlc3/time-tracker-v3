import type { Segment, Session } from './types'

export const MINUTE = 60_000

/** epoch ms を "HH:MM" 表記に */
export function formatClock(epoch: number): string {
  const d = new Date(epoch)
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

/** ミリ秒を "H:MM:SS" / "MM:SS" のデジタル表記に (タイマー表示用) */
export function formatDigital(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** ミリ秒を "2時間32分" / "35分" の人間向け表記に */
export function formatHuman(ms: number): string {
  const totalMin = Math.round(ms / MINUTE)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}時間${m}分`
  if (h > 0) return `${h}時間`
  return `${m}分`
}

/** 区間の実績時間 (ms)。進行中は now まで */
export function segmentDuration(seg: Segment, now: number): number {
  return (seg.end ?? now) - seg.start
}

/** セッションの実績時間 (ms)。進行中は now まで */
export function sessionDuration(session: Session, now: number): number {
  return (session.end ?? now) - session.start
}

export function focusMs(session: Session, now: number): number {
  return session.segments
    .filter((s) => s.type === 'FOCUS')
    .reduce((sum, s) => sum + segmentDuration(s, now), 0)
}

export function breakMs(session: Session, now: number): number {
  return session.segments
    .filter((s) => s.type === 'BREAK')
    .reduce((sum, s) => sum + segmentDuration(s, now), 0)
}

/** 対象日キー YYYY-MM-DD (ローカルタイム) */
export function dateKey(epoch: number = Date.now()): string {
  const d = new Date(epoch)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`
}

/** YYYY-MM-DD を "M月D日(曜)" に */
export function formatDateLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const wd = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${m}月${d}日 (${wd})`
}

/** "HH:MM" 文字列を対象日の epoch ms に。翌日跨ぎは end> start で +1日 */
export function timeStrToEpoch(dayKey: string, time: string): number {
  const [y, mo, d] = dayKey.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi, 0, 0).getTime()
}

/** epoch を <input type="datetime-local"> 用に */
export function epochToDatetimeLocal(epoch: number): string {
  const d = new Date(epoch)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(
    2,
    '0',
  )}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function datetimeLocalToEpoch(value: string): number {
  return new Date(value).getTime()
}

/** 2 つの時間帯 [aStart,aEnd] と [bStart,bEnd] が重複するか */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}
