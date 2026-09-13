export type SegmentType = 'FOCUS' | 'BREAK'

export interface Tag {
  id: string
  name: string
  color: string
}

/** 活動セッション内部の FOCUS / BREAK 区間 */
export interface Segment {
  id: string
  type: SegmentType
  /** 開始時刻 (epoch ms) */
  start: number
  /** 終了時刻 (epoch ms)。進行中は null */
  end: number | null
  /** 予定時間 (分)。未設定は null */
  plannedMin: number | null
}

/** 活動セッション: 1 つの活動を継続している大きな時間枠 */
export interface Session {
  id: string
  tagId: string
  /** 集計対象日 YYYY-MM-DD。開始日時とは独立した値 */
  activityDate: string
  start: number
  end: number | null
  /** セッション予定時間 (分)。未設定は null */
  plannedMin: number | null
  /** セッション予定終了時刻 (epoch ms)。未設定は null */
  plannedEndAt: number | null
  segments: Segment[]
}

/** 時刻を持たない手動時間記録 (手動入力パターン4) */
export interface ManualRecord {
  id: string
  tagId: string
  /** 対象日 YYYY-MM-DD */
  date: string
  totalMin: number
  focusMin: number
  breakMin: number
}

export interface AppState {
  tags: Tag[]
  sessions: Session[]
  manualRecords: ManualRecord[]
}
