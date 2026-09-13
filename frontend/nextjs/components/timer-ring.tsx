import { cn } from '@/lib/utils'

interface TimerRingProps {
  /** 0..1 以上。1 を超えると超過 */
  progress: number
  variant: 'focus' | 'break'
  indeterminate?: boolean
  overtime?: boolean
  children: React.ReactNode
  className?: string
}

const SIZE = 288
const STROKE = 14
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

export function TimerRing({
  progress,
  variant,
  indeterminate = false,
  overtime = false,
  children,
  className,
}: TimerRingProps) {
  const clamped = Math.max(0, Math.min(1, progress))
  const offset = indeterminate ? C : C * (1 - clamped)
  const stroke = variant === 'focus' ? 'var(--focus)' : 'var(--break)'

  return (
    <div
      className={cn('relative aspect-square w-full max-w-[288px]', className)}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-full -rotate-90"
        role="img"
        aria-label="タイマー"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={STROKE}
        />
        {!indeterminate && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            className={cn(
              'transition-[stroke-dashoffset] duration-500 ease-linear',
              overtime && 'animate-pulse',
            )}
            style={{ opacity: overtime ? 0.5 : 1 }}
          />
        )}
        {overtime && !indeterminate && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${C * 0.06} ${C}`}
            strokeDashoffset={C * (1 - (progress % 1))}
            className="transition-[stroke-dashoffset] duration-500 ease-linear"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
        {children}
      </div>
    </div>
  )
}
