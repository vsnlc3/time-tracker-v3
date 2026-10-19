/** バックエンドと共有する集中・休憩の区分値です。 */
export type SegmentType = 'FOCUS' | 'BREAK'

/** `/api/users/me` が返すログイン利用者情報です。 */
export type ApiUser = {
  id: number
  displayName: string
  email: string
}

/** `/api/tags` が返すタグ情報です。 */
export type ApiTag = {
  id: number
  displayName: string
  color: string
}

/** セッションに含まれる時間区間のバックエンド応答です。時刻は ISO 文字列です。 */
export type ApiSegment = {
  id: number
  segmentType: SegmentType
  startedAt: string
  endedAt: string | null
  plannedDurationSeconds: number | null
  durationSeconds: number
}

/** 活動セッションのバックエンド応答です。進行中の終了時刻は null になります。 */
export type ApiActivitySession = {
  id: number
  tagId: number
  tagDisplayName: string
  activityDate: string
  startedAt: string
  endedAt: string | null
  plannedDurationSeconds: number | null
  plannedEndAt: string | null
  durationSeconds: number
  active: boolean
  segments: ApiSegment[]
}

/** 時刻を持たない手動記録のバックエンド応答です。 */
export type ApiManualTimeEntry = {
  id: number
  tagId: number
  tagDisplayName: string
  activityDate: string
  totalSeconds: number
  focusSeconds: number
  breakSeconds: number
}

/** 日次サマリー内のタグ別時間内訳です。 */
export type ApiTagSummary = {
  tagId: number
  tagDisplayName: string
  totalSeconds: number
  focusSeconds: number
  breakSeconds: number
}

/** 日次サマリー API が返す合計、タグ別集計、元記録のまとまりです。 */
export type ApiSummary = {
  activityDate: string
  totalSeconds: number
  focusSeconds: number
  breakSeconds: number
  tagSummaries: ApiTagSummary[]
  activitySessions: ApiActivitySession[]
  manualTimeEntries: ApiManualTimeEntry[]
}

/** セッション開始 API に送る入力です。省略した計画値は未設定として扱われます。 */
export type StartActivitySessionInput = {
  tagId: number
  activityDate: string
  initialSegmentType: SegmentType
  segmentPlannedDurationSeconds?: number
  plannedDurationSeconds?: number
  plannedEndAt?: string
}

/** セッション編集 API に送る新しい時刻・タグ・計画値です。 */
export type ActivitySessionUpdateInput = {
  tagId: number
  activityDate: string
  startedAt: string
  endedAt?: string
  plannedDurationSeconds?: number
  plannedEndAt?: string
}

/** セグメント切り替え API に送る次の区分と任意の計画時間です。 */
export type SegmentSwitchInput = {
  segmentType: SegmentType
  plannedDurationSeconds?: number
}

/** セグメント編集 API に送る値です。終了時刻を省略すると進行中区間を表します。 */
export type SessionSegmentUpdateInput = {
  segmentType: SegmentType
  startedAt: string
  endedAt?: string
  plannedDurationSeconds?: number
}

/** 時刻付き手動セッション作成 API に送る値です。時刻または時間の指定を使います。 */
export type TimedManualInput = {
  tagId: number
  activityDate: string
  segmentType: SegmentType
  startedAt?: string
  endedAt?: string
  durationSeconds?: number
}

/** 日単位の手動記録作成 API に送る時間内訳です。 */
export type ManualTimeEntryInput = {
  tagId: number
  activityDate: string
  totalSeconds: number
  focusSeconds: number
  breakSeconds: number
}

/** HTTP エラー応答のステータスと表示用メッセージを保持します。 */
export class ApiRequestError extends Error {
  readonly status: number

  /** API が返した HTTP ステータスとエラーメッセージを設定します。 */
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

/** ブラウザーから指定 Cookie を読み取ります。SSR 中は document がないため null を返します。 */
function readCookie(name: string) {
  if (typeof document === 'undefined') return null
  const prefix = `${encodeURIComponent(name)}=`
  const value = document.cookie.split('; ').find((item) => item.startsWith(prefix))
  return value ? decodeURIComponent(value.slice(prefix.length)) : null
}

/**
 * Spring API への通信を共通化します。変更系リクエストには CSRF ヘッダーを付け、
 * セッション Cookie とエラー形式を全 API で一貫して扱います。
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (init.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method.toUpperCase())) {
    const csrfToken = readCookie('XSRF-TOKEN')
    if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken)
  }

  const response = await fetch(`/spring-api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers,
    cache: 'no-store',
  })
  if (response.status === 204) return undefined as T
  const payload = (await response.json().catch(() => null)) as { message?: string } | null
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      payload?.message ?? `API request failed (${response.status})`,
    )
  }
  return payload as T
}

/** CSRF Cookie を初期化するためのトークン取得 API を呼び出します。 */
export function getCsrfToken() {
  return request<{ token: string }>('/auth/csrf')
}

/** ログイン中の利用者を取得します。 */
export function getCurrentUser() {
  return request<ApiUser>('/users/me')
}

/** 利用者のタグ一覧を取得します。 */
export function getTags() {
  return request<ApiTag[]>('/tags')
}

/** タグを新規作成します。 */
export function createTag(displayName: string, color: string) {
  return request<ApiTag>('/tags', {
    method: 'POST',
    body: JSON.stringify({ displayName, color }),
  })
}

/** タグの表示名と色を更新します。 */
export function updateTag(tagId: number, displayName: string, color: string) {
  return request<ApiTag>(`/tags/${tagId}`, {
    method: 'PUT',
    body: JSON.stringify({ displayName, color }),
  })
}

/** タグを削除します。 */
export function deleteTag(tagId: number) {
  return request<void>(`/tags/${tagId}`, { method: 'DELETE' })
}

/** 指定日のサマリーを取得します。 */
export function getSummary(activityDate: string) {
  return request<ApiSummary>(`/summary?activityDate=${encodeURIComponent(activityDate)}`)
}

/** セッション一覧を取得します。日付を省略すると全期間が対象です。 */
export function getActivitySessions(activityDate?: string) {
  const query = activityDate ? `?activityDate=${encodeURIComponent(activityDate)}` : ''
  return request<ApiActivitySession[]>(`/activity-sessions${query}`)
}

/** 利用者の進行中セッションを取得します。 */
export function getActiveSession() {
  return request<ApiActivitySession | null>('/activity-sessions/active')
}

/** 新しい活動セッションを開始します。 */
export function startActivitySession(input: StartActivitySessionInput) {
  return request<ApiActivitySession>('/activity-sessions/start', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** セッションを終了します。 */
export function finishActivitySession(sessionId: number) {
  return request<ApiActivitySession>(`/activity-sessions/${sessionId}/finish`, { method: 'POST' })
}

/** 実行中セッションの区分を切り替えます。 */
export function switchSessionSegment(sessionId: number, input: SegmentSwitchInput) {
  return request<ApiActivitySession>(`/activity-sessions/${sessionId}/switch`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** 開始・終了時刻が分かる手動セッションを登録します。 */
export function createTimedManualSession(input: TimedManualInput) {
  return request<ApiActivitySession>('/activity-sessions/manual', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** 活動セッションの属性と時間範囲を更新します。 */
export function updateActivitySession(sessionId: number, input: ActivitySessionUpdateInput) {
  return request<ApiActivitySession>(`/activity-sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

/** 活動セッションを削除します。 */
export function deleteActivitySession(sessionId: number) {
  return request<void>(`/activity-sessions/${sessionId}`, { method: 'DELETE' })
}

/** セッション内の個別区間を更新します。 */
export function updateSessionSegment(segmentId: number, input: SessionSegmentUpdateInput) {
  return request<ApiSegment>(`/session-segments/${segmentId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

/** セッション内の個別区間を削除します。 */
export function deleteSessionSegment(segmentId: number) {
  return request<void>(`/session-segments/${segmentId}`, { method: 'DELETE' })
}

/** 時刻を持たない手動記録を取得します。日付を省略すると全期間が対象です。 */
export function getManualTimeEntries(activityDate?: string) {
  const query = activityDate ? `?activityDate=${encodeURIComponent(activityDate)}` : ''
  return request<ApiManualTimeEntry[]>(`/manual-time-entries${query}`)
}

/** 集中・休憩時間だけで表す手動記録を作成します。 */
export function createManualTimeEntry(input: ManualTimeEntryInput) {
  return request<ApiManualTimeEntry>('/manual-time-entries', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** 手動記録を削除します。 */
export function deleteManualTimeEntry(entryId: number) {
  return request<void>(`/manual-time-entries/${entryId}`, { method: 'DELETE' })
}

/** ログアウトしてサーバー側セッションを終了します。 */
export function logout() {
  return request<void>('/auth/logout', { method: 'POST' })
}
