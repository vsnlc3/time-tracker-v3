'use client'

import * as React from 'react'
import { Brain, Coffee, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import type { SegmentType } from '@/lib/types'
import { useStore } from '@/lib/store'
import { TagSelect } from '@/components/tag-select'
import { cn } from '@/lib/utils'

export function StartForm() {
  const { state, startSession } = useStore()
  const [tagId, setTagId] = React.useState(state.tags[0]?.id ?? '')
  const [initialType, setInitialType] = React.useState<SegmentType>('FOCUS')
  const [segPlanned, setSegPlanned] = React.useState('25')
  const [segEnabled, setSegEnabled] = React.useState(true)
  const [sessionPlanned, setSessionPlanned] = React.useState('')
  const editedRef = React.useRef(false)

  React.useEffect(() => {
    if (!tagId && state.tags[0]) setTagId(state.tags[0].id)
  }, [state.tags, tagId])

  function handleType(next: SegmentType) {
    setInitialType(next)
    if (!editedRef.current) setSegPlanned(next === 'FOCUS' ? '25' : '5')
  }

  async function handleStart() {
    if (!tagId) {
      toast.error('タグを選択してください。')
      return
    }
    const segMin = segEnabled ? Number(segPlanned) : null
    if (segEnabled && (!segMin || segMin <= 0)) {
      toast.error('予定時間は1分以上で入力してください。')
      return
    }
    const sessMin = sessionPlanned.trim() ? Number(sessionPlanned) : null
    if (sessMin != null && sessMin <= 0) {
      toast.error('セッション予定時間が正しくありません。')
      return
    }
    const res = await startSession({
      tagId,
      initialType,
      segmentPlannedMin: segMin,
      sessionPlannedMin: sessMin,
    })
    if (!res.ok) toast.error(res.error)
    else toast.success('セッションを開始しました。')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>新しいセッションを開始</CardTitle>
        <CardDescription>
          活動を選び、FOCUS か BREAK のどちらで始めるか決めましょう。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>活動タグ</FieldLabel>
            <TagSelect value={tagId} onChange={setTagId} className="w-full" />
          </Field>

          <Field>
            <FieldLabel>開始する状態</FieldLabel>
            <ToggleGroup
              value={[initialType]}
              onValueChange={(v) => v[0] && handleType(v[0] as SegmentType)}
              className="w-full *:flex-1"
              variant="outline"
            >
              <ToggleGroupItem
                value="FOCUS"
                className={cn(
                  'data-[state=on]:!bg-focus-muted data-[state=on]:!text-focus',
                )}
              >
                <Brain data-icon="inline-start" />
                FOCUS
              </ToggleGroupItem>
              <ToggleGroupItem
                value="BREAK"
                className={cn(
                  'data-[state=on]:!bg-break-muted data-[state=on]:!text-break',
                )}
              >
                <Coffee data-icon="inline-start" />
                BREAK
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="seg-plan">
              {initialType === 'FOCUS' ? 'FOCUS' : 'BREAK'} の予定時間を設定
            </FieldLabel>
            <Switch
              id="seg-plan"
              checked={segEnabled}
              onCheckedChange={setSegEnabled}
            />
          </Field>

          {segEnabled && (
            <Field>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={segPlanned}
                  onChange={(e) => {
                    editedRef.current = true
                    setSegPlanned(e.target.value)
                  }}
                  className="w-24"
                  inputMode="numeric"
                />
                <span className="text-sm text-muted-foreground">分</span>
                <div className="ml-auto flex gap-1.5">
                  {[15, 25, 45, 60].map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        editedRef.current = true
                        setSegPlanned(String(m))
                      }}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="sess-plan">
              セッション全体の予定時間（任意）
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="sess-plan"
                type="number"
                min={1}
                placeholder="例: 90"
                value={sessionPlanned}
                onChange={(e) => setSessionPlanned(e.target.value)}
                className="w-24"
                inputMode="numeric"
              />
              <span className="text-sm text-muted-foreground">分</span>
            </div>
          </Field>

          <Button size="lg" className="w-full" onClick={handleStart}>
            <Play data-icon="inline-start" />
            セッションを開始
          </Button>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
