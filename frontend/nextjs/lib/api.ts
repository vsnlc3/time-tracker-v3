export type SegmentType = 'FOCUS' | 'BREAK'

export type ApiUser = {
  id: number
  displayName: string
  email: string
}

export type ApiTag = {
  id: number
  displayName: string
  color: string
}

export type ApiSegment = {
  id: number
  segmentType: SegmentType
  startedAt: string
  endedAt: string | null
  plannedDurationSeconds: number | null
  durationSeconds: number
}

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

export type ApiManualTimeEntry = {
  id: number
  tagId: number
  tagDisplayName: string
  activityDate: string
  totalSeconds: number
  focusSeconds: number
  breakSeconds: number
}

export type ApiTagSummary = {
  tagId: number
  tagDisplayName: string
  totalSeconds: number
  focusSeconds: number
  breakSeconds: number
}

export type ApiSummary = {
  activityDate: string
  totalSeconds: number
  focusSeconds: number
  breakSeconds: number
  tagSummaries: ApiTagSummary[]
  activitySessions: ApiActivitySession[]
  manualTimeEntries: ApiManualTimeEntry[]
}

export type StartActivitySessionInput = {
  tagId: number
  activityDate: string
  initialSegmentType: SegmentType
  segmentPlannedDurationSeconds?: number
  plannedDurationSeconds?: number
  plannedEndAt?: string
}

export type ActivitySessionUpdateInput = {
  tagId: number
  activityDate: string
  startedAt: string
  endedAt?: string
  plannedDurationSeconds?: number
  plannedEndAt?: string
}

export type SegmentSwitchInput = {
  segmentType: SegmentType
  plannedDurationSeconds?: number
}

export type SessionSegmentUpdateInput = {
  segmentType: SegmentType
  startedAt: string
  endedAt?: string
  plannedDurationSeconds?: number
}

export type TimedManualInput = {
  tagId: number
  activityDate: string
  segmentType: SegmentType
  startedAt?: string
  endedAt?: string
  durationSeconds?: number
}

export type ManualTimeEntryInput = {
  tagId: number
  activityDate: string
  totalSeconds: number
  focusSeconds: number
  breakSeconds: number
}

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return null
  const prefix = `${encodeURIComponent(name)}=`
  const value = document.cookie.split('; ').find((item) => item.startsWith(prefix))
  return value ? decodeURIComponent(value.slice(prefix.length)) : null
}

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

export function getCsrfToken() {
  return request<{ token: string }>('/auth/csrf')
}

export function getCurrentUser() {
  return request<ApiUser>('/users/me')
}

export function getTags() {
  return request<ApiTag[]>('/tags')
}

export function createTag(displayName: string, color: string) {
  return request<ApiTag>('/tags', {
    method: 'POST',
    body: JSON.stringify({ displayName, color }),
  })
}

export function updateTag(tagId: number, displayName: string, color: string) {
  return request<ApiTag>(`/tags/${tagId}`, {
    method: 'PUT',
    body: JSON.stringify({ displayName, color }),
  })
}

export function deleteTag(tagId: number) {
  return request<void>(`/tags/${tagId}`, { method: 'DELETE' })
}

export function getSummary(activityDate: string) {
  return request<ApiSummary>(`/summary?activityDate=${encodeURIComponent(activityDate)}`)
}

export function getActivitySessions(activityDate?: string) {
  const query = activityDate ? `?activityDate=${encodeURIComponent(activityDate)}` : ''
  return request<ApiActivitySession[]>(`/activity-sessions${query}`)
}

export function getActiveSession() {
  return request<ApiActivitySession | null>('/activity-sessions/active')
}

export function startActivitySession(input: StartActivitySessionInput) {
  return request<ApiActivitySession>('/activity-sessions/start', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function finishActivitySession(sessionId: number) {
  return request<ApiActivitySession>(`/activity-sessions/${sessionId}/finish`, { method: 'POST' })
}

export function switchSessionSegment(sessionId: number, input: SegmentSwitchInput) {
  return request<ApiActivitySession>(`/activity-sessions/${sessionId}/switch`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function createTimedManualSession(input: TimedManualInput) {
  return request<ApiActivitySession>('/activity-sessions/manual', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateActivitySession(sessionId: number, input: ActivitySessionUpdateInput) {
  return request<ApiActivitySession>(`/activity-sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteActivitySession(sessionId: number) {
  return request<void>(`/activity-sessions/${sessionId}`, { method: 'DELETE' })
}

export function updateSessionSegment(segmentId: number, input: SessionSegmentUpdateInput) {
  return request<ApiSegment>(`/session-segments/${segmentId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteSessionSegment(segmentId: number) {
  return request<void>(`/session-segments/${segmentId}`, { method: 'DELETE' })
}

export function getManualTimeEntries(activityDate?: string) {
  const query = activityDate ? `?activityDate=${encodeURIComponent(activityDate)}` : ''
  return request<ApiManualTimeEntry[]>(`/manual-time-entries${query}`)
}

export function createManualTimeEntry(input: ManualTimeEntryInput) {
  return request<ApiManualTimeEntry>('/manual-time-entries', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteManualTimeEntry(entryId: number) {
  return request<void>(`/manual-time-entries/${entryId}`, { method: 'DELETE' })
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' })
}
