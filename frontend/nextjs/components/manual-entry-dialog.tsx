'use client'

import * as React from 'react'
import { Brain, Coffee } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { SegmentType } from '@/lib/types'
import { useStore } from '@/lib/store'
import { dateKey } from '@/lib/time'
import { TagSelect } from '@/components/tag-select'
import { cn } from '@/lib/utils'

export function ManualEntryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, addTimedRecord, addUntimedRecord } = useStore()
  const firstTag = state.tags[0]?.id ?? ''

  // shared
  const [tagId, setTagId] = React.useState(firstTag)
  const [day, setDay] = React.useState(dateKey())

  // timed
  const [type, setType] = React.useState<SegmentType>('FOCUS')
  const [startTime, setStartTime] = React.useState('')
  const [endTime, setEndTime] = React.useState('')
  const [totalMin, setTotalMin] = React.useState('')

  // untimed
  const [focusMin, setFocusMin] = React.useState('')
  const [breakMin, setBreakMin] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setTagId((cur) => cur || firstTag)
      setDay(dateKey())
    }
  }, [open, firstTag])

  async function submitTimed() {
    const filled = [startTime, endTime, totalMin.trim()].filter(Boolean).length
    if (filled < 2) {
      toast.error('開始・終了・合計時間のうち2つを入力してください。')
      return
    }
    const res = await addTimedRecord({
      tagId,
      dayKey: day,
      type,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      totalMin: totalMin.trim() ? Number(totalMin) : undefined,
    })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('記録を追加しました。')
    setStartTime('')
    setEndTime('')
    setTotalMin('')
    onOpenChange(false)
  }

  async function submitUntimed() {
    const f = focusMin.trim() ? Number(focusMin) : 0
    const b = breakMin.trim() ? Number(breakMin) : 0
    const res = await addUntimedRecord(tagId, day, f, b)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('記録を追加しました。')
    setFocusMin('')
    setBreakMin('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>時間を手動で記録</DialogTitle>
          <DialogDescription>
            記録し忘れた活動を後から追加できます。
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>タグ</FieldLabel>
              <TagSelect value={tagId} onChange={setTagId} className="w-full" />
            </Field>
            <Field>
              <FieldLabel htmlFor="m-date">日付</FieldLabel>
              <Input
                id="m-date"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </Field>
          </div>
        </FieldGroup>

        <Tabs defaultValue="timed" className="mt-2 w-full">
          <TabsList className="w-full *:flex-1">
            <TabsTrigger value="timed">時刻から</TabsTrigger>
            <TabsTrigger value="untimed">時間だけ</TabsTrigger>
          </TabsList>

          <TabsContent value="timed">
            <FieldGroup>
              <Field>
                <FieldLabel>状態</FieldLabel>
                <ToggleGroup
                  value={[type]}
                  onValueChange={(v) => v[0] && setType(v[0] as SegmentType)}
                  variant="outline"
                  className="w-full *:flex-1"
                >
                  <ToggleGroupItem
                    value="FOCUS"
                    className="data-[state=on]:!bg-focus-muted data-[state=on]:!text-focus"
                  >
                    <Brain data-icon="inline-start" />
                    FOCUS
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="BREAK"
                    className="data-[state=on]:!bg-break-muted data-[state=on]:!text-break"
                  >
                    <Coffee data-icon="inline-start" />
                    BREAK
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="m-start">開始時刻</FieldLabel>
                  <Input
                    id="m-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="m-end">終了時刻</FieldLabel>
                  <Input
                    id="m-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="m-total">合計時間（分）</FieldLabel>
                <Input
                  id="m-total"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="例: 45"
                  value={totalMin}
                  onChange={(e) => setTotalMin(e.target.value)}
                />
                <FieldDescription>
                  開始・終了・合計のうち2つを入力すると残りを自動計算します。
                </FieldDescription>
              </Field>
              <Button onClick={submitTimed}>この内容で記録</Button>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="untimed">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="u-focus">FOCUS（分）</FieldLabel>
                  <Input
                    id="u-focus"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="例: 50"
                    value={focusMin}
                    onChange={(e) => setFocusMin(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="u-break">BREAK（分）</FieldLabel>
                  <Input
                    id="u-break"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="例: 10"
                    value={breakMin}
                    onChange={(e) => setBreakMin(e.target.value)}
                  />
                </Field>
              </div>
              <FieldDescription className={cn('-mt-1')}>
                時刻が分からない活動を、集中・休憩の合計時間だけで記録します。
              </FieldDescription>
              <Button onClick={submitUntimed}>この内容で記録</Button>
            </FieldGroup>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
