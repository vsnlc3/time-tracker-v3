/** カテゴリ用のデータ駆動カラーパレット (テーマトークンとは別) */
export const TAG_COLORS: { key: string; label: string; value: string }[] = [
  { key: 'green', label: 'グリーン', value: 'oklch(0.745 0.13 168)' },
  { key: 'sky', label: 'スカイ', value: 'oklch(0.7 0.12 230)' },
  { key: 'violet', label: 'バイオレット', value: 'oklch(0.68 0.13 300)' },
  { key: 'amber', label: 'アンバー', value: 'oklch(0.802 0.126 76)' },
  { key: 'rose', label: 'ローズ', value: 'oklch(0.7 0.15 12)' },
  { key: 'slate', label: 'スレート', value: 'oklch(0.68 0.02 264)' },
]

const map = new Map(TAG_COLORS.map((c) => [c.key, c.value]))

export function tagColorValue(key: string): string {
  return map.get(key) ?? TAG_COLORS[0].value
}
