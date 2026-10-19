import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** 条件付きクラス名を連結し、Tailwind の競合ユーティリティを整理します。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
