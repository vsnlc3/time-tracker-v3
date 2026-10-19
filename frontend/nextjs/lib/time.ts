import type { Segment, Session } from './types'

/** 1 分を表すミリ秒数です。画面モデルの時間計算で使います。 */
export const MINUTE = 60_000

/** ローカル時刻の epoch ミリ秒を時計表示用の `HH:MM` に整形します。 */
export function formatClock(epoch: number): string {
  const d = new Date(epoch)
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

/** 経過ミリ秒をタイマー用の `H:MM:SS` または `MM:SS` に整形します。 */
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

/** 経過ミリ秒を分単位に丸め、日本語の時間表示に整形します。 */
export function formatHuman(ms: number): string {
  const totalMin = Math.round(ms / MINUTE)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}時間${m}分`
  if (h > 0) return `${h}時間`
  return `${m}分`
}

/** 区間の実績ミリ秒を返します。終了前の区間は指定時刻 `now` までとして計算します。 */
export function segmentDuration(seg: Segment, now: number): number {
  return (seg.end ?? now) - seg.start
}

/** セッションの実績ミリ秒を返します。進行中は指定時刻 `now` までとして計算します。 */
export function sessionDuration(session: Session, now: number): number {
  return (session.end ?? now) - session.start
}

/** セッションに含まれる FOCUS 区間の実績時間を合算します。 */
export function focusMs(session: Session, now: number): number {
  return session.segments
    .filter((s) => s.type === 'FOCUS')
    .reduce((sum, s) => sum + segmentDuration(s, now), 0)
}

/** セッションに含まれる BREAK 区間の実績時間を合算します。 */
export function breakMs(session: Session, now: number): number {
  return session.segments
    .filter((s) => s.type === 'BREAK')
    .reduce((sum, s) => sum + segmentDuration(s, now), 0)
}

/** epoch ミリ秒をローカル日付の `YYYY-MM-DD` キーに変換します。 */
export function dateKey(epoch: number = Date.now()): string {
  const d = new Date(epoch)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`
}

/** `YYYY-MM-DD` の日付キーを日本語の月日・曜日表示に変換します。 */
export function formatDateLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const wd = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${m}月${d}日 (${wd})`
}

/** 対象日の `HH:MM` をローカル時刻の epoch ミリ秒に変換します。 */
export function timeStrToEpoch(dayKey: string, time: string): number {
  const [y, mo, d] = dayKey.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi, 0, 0).getTime()
}

/** epoch ミリ秒をローカル時刻の `datetime-local` 入力値に変換します。 */
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

/** `datetime-local` のローカル時刻文字列を epoch ミリ秒に変換します。 */
export function datetimeLocalToEpoch(value: string): number {
  return new Date(value).getTime()
}

/** 2 つの半開区間が重なるかを判定します。終了と次の開始が同じ時刻なら重複しません。 */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}
