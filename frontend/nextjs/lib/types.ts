/** 画面内で扱う時間区分です。API の同名型と値をそろえます。 */
export type SegmentType = 'FOCUS' | 'BREAK'

/** 画面で使うタグモデルです。API の ID は文字列に変換して保持します。 */
export interface Tag {
  id: string
  name: string
  color: string
}

/** 活動セッション内を連続した FOCUS / BREAK の時間区間に分けたモデルです。 */
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

/** 1 つの活動を継続している大きな時間枠です。複数の区間をまとめます。 */
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

/** 開始・終了時刻を記録せず、日単位で合計時間だけを持つ手動記録です。 */
export interface ManualRecord {
  id: string
  tagId: string
  /** 対象日 YYYY-MM-DD */
  date: string
  totalMin: number
  focusMin: number
  breakMin: number
}

/** API から取得したタグ・セッション・手動記録を画面用にまとめた状態です。 */
export interface AppState {
  tags: Tag[]
  sessions: Session[]
  manualRecords: ManualRecord[]
}
