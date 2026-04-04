'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { formatKRW, PAYER_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/format'
import type { PlannedExpense, Payer, PaymentMethod } from '@/lib/types'
import { toast } from 'sonner'

interface ScheduleViewProps {
  expenses: PlannedExpense[]
  onItemsChange: (items: PlannedExpense[]) => void
}

export function ScheduleView({ expenses: items, onItemsChange }: ScheduleViewProps) {
  const [payerFilter, setPayerFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  const filtered = items.filter((item) => {
    if (payerFilter !== 'all' && item.payer !== payerFilter) return false
    if (methodFilter !== 'all' && item.payment_method !== methodFilter) return false
    return true
  })

  // 날짜별 그룹화
  const groups: Record<string, PlannedExpense[]> = {}
  const noDates: PlannedExpense[] = []

  for (const item of filtered) {
    if (item.billing_date) {
      const key = String(item.billing_date)
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    } else {
      noDates.push(item)
    }
  }

  const sortedKeys = Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b))

  async function toggleStatus(item: PlannedExpense) {
    const newStatus = item.status === 'done' ? 'planned' : 'done'
    const supabase = createClient()
    const { data, error } = await supabase
      .from('planned_expenses')
      .update({ status: newStatus })
      .eq('id', item.id)
      .select()
      .single()

    if (error) {
      toast.error('상태 변경 실패')
    } else if (data) {
      onItemsChange(items.map((i) => (i.id === item.id ? (data as PlannedExpense) : i)))
    }
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex gap-2 flex-wrap">
        <Select value={payerFilter} onValueChange={(v) => v && setPayerFilter(v)}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 납부자</SelectItem>
            {Object.entries(PAYER_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={(v) => v && setMethodFilter(v)}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 지출방법</SelectItem>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 날짜별 그룹 */}
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">표시할 항목이 없습니다.</p>
      )}

      {sortedKeys.map((day) => (
        <div key={day}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-700">📅 {day}일</span>
            <span className="text-xs text-gray-400">
              {formatKRW(groups[day].reduce((s, i) => s + i.amount, 0))}
            </span>
          </div>
          <div className="space-y-1 ml-2">
            {groups[day].map((item) => (
              <ScheduleItem key={item.id} item={item} onToggle={toggleStatus} />
            ))}
          </div>
        </div>
      ))}

      {noDates.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2">📋 날짜 미지정</p>
          <div className="space-y-1 ml-2">
            {noDates.map((item) => (
              <ScheduleItem key={item.id} item={item} onToggle={toggleStatus} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScheduleItem({
  item,
  onToggle,
}: {
  item: PlannedExpense
  onToggle: (item: PlannedExpense) => void
}) {
  const isDone = item.status === 'done'
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        isDone ? 'bg-gray-50 opacity-60' : 'bg-white border'
      }`}
    >
      <input
        type="checkbox"
        checked={isDone}
        onChange={() => onToggle(item)}
        className="w-4 h-4 rounded accent-green-500 cursor-pointer shrink-0"
      />
      <span className={`flex-1 font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {item.item_name || '(항목명 없음)'}
      </span>
      <span className="font-semibold text-gray-900">{formatKRW(item.amount)}</span>
      {item.payment_method && (
        <span className="text-xs text-gray-400 hidden sm:inline">
          {PAYMENT_METHOD_LABELS[item.payment_method as PaymentMethod]}
        </span>
      )}
      {item.payer && (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {PAYER_LABELS[item.payer as Payer]}
        </span>
      )}
    </div>
  )
}
