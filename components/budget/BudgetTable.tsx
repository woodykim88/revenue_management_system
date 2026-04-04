'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import {
  formatAmountInput,
  parseAmount,
  formatKRW,
  PAYMENT_METHOD_LABELS,
  PAYER_LABELS,
  STATUS_LABELS,
} from '@/lib/format'
import type { PlannedExpense, Category, PaymentMethod, Payer, Status } from '@/lib/types'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'

interface BudgetTableProps {
  category: Category
  monthId: string
  items: PlannedExpense[]
  onItemsChange: (items: PlannedExpense[]) => void
}

const STATUS_COLORS: Record<Status, string> = {
  planned: 'bg-gray-100 text-gray-700',
  done: 'bg-green-100 text-green-700',
  hold: 'bg-yellow-100 text-yellow-700',
}

const CATEGORY_ICONS: Record<Category, string> = {
  savings: '💰',
  fixed: '🏠',
  living: '🛒',
}

const CATEGORY_LABELS_KR: Record<Category, string> = {
  savings: '저축비',
  fixed: '고정비',
  living: '생활비',
}

export function BudgetTable({ category, monthId, items, onItemsChange }: BudgetTableProps) {
  const [addingRow, setAddingRow] = useState(false)

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  const isLiving = category === 'living'

  async function handleAddItem() {
    setAddingRow(true)
    const supabase = createClient()
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0

    const { data, error } = await supabase
      .from('planned_expenses')
      .insert({
        month_id: monthId,
        category,
        sort_order: maxOrder,
        item_name: '',
        amount: 0,
        status: 'planned',
      })
      .select()
      .single()

    if (error) {
      toast.error('항목 추가 실패')
    } else if (data) {
      onItemsChange([...items, data as PlannedExpense])
    }
    setAddingRow(false)
  }

  async function handleUpdateItem(id: string, field: string, value: string | number) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('planned_expenses')
      .update({ [field]: value })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('저장 실패')
    } else if (data) {
      onItemsChange(items.map((item) => (item.id === id ? (data as PlannedExpense) : item)))
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('이 항목을 삭제할까요?')) return
    const supabase = createClient()
    const { error } = await supabase.from('planned_expenses').delete().eq('id', id)

    if (error) {
      toast.error('삭제 실패')
    } else {
      onItemsChange(items.filter((item) => item.id !== id))
      toast.success('항목 삭제됨')
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[category]}</span>
          <span className="font-semibold text-gray-900">{CATEGORY_LABELS_KR[category]}</span>
        </div>
        <span className="font-bold text-gray-900">{formatKRW(total)}</span>
      </div>

      {/* 테이블 — 데스크탑 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/50 text-gray-500 text-xs">
              <th className="px-3 py-2 text-left font-medium w-36">항목명</th>
              <th className="px-3 py-2 text-right font-medium w-28">예상금액</th>
              <th className="px-3 py-2 text-left font-medium">세부설명</th>
              <th className="px-3 py-2 text-left font-medium w-24">지출방법</th>
              <th className="px-3 py-2 text-left font-medium w-20">납부자</th>
              <th className="px-3 py-2 text-left font-medium w-24">
                {isLiving ? '관리방법' : '세부방법'}
              </th>
              {!isLiving && (
                <>
                  <th className="px-3 py-2 text-center font-medium w-16">지급일</th>
                  <th className="px-3 py-2 text-center font-medium w-16">납부일</th>
                </>
              )}
              <th className="px-3 py-2 text-center font-medium w-16">상태</th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={isLiving ? 8 : 10}
                  className="px-4 py-6 text-center text-gray-400 text-sm"
                >
                  항목이 없습니다. 아래 + 버튼으로 추가하세요.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <BudgetRow
                key={item.id}
                item={item}
                isLiving={isLiving}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 목록 */}
      <div className="md:hidden divide-y">
        {items.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400 text-sm">
            항목이 없습니다.
          </p>
        )}
        {items.map((item) => (
          <MobileRow
            key={item.id}
            item={item}
            isLiving={isLiving}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>

      {/* 추가 버튼 */}
      <div className="px-4 py-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 w-full"
          onClick={handleAddItem}
          disabled={addingRow}
        >
          <Plus className="w-4 h-4 mr-1" />
          항목 추가
        </Button>
      </div>
    </div>
  )
}

/* ─── 데스크탑 행 ─── */
interface RowProps {
  item: PlannedExpense
  isLiving: boolean
  onUpdate: (id: string, field: string, value: string | number) => void
  onDelete: (id: string) => void
}

function BudgetRow({ item, isLiving, onUpdate, onDelete }: RowProps) {
  const [amount, setAmount] = useState(item.amount > 0 ? item.amount.toLocaleString('ko-KR') : '')

  function handleAmountBlur() {
    const parsed = parseAmount(amount)
    if (parsed !== item.amount) onUpdate(item.id, 'amount', parsed)
  }

  return (
    <tr className="border-b hover:bg-gray-50/50 transition-colors">
      <td className="px-3 py-2">
        <Input
          className="h-7 text-sm border-0 bg-transparent px-1 focus-visible:ring-1"
          defaultValue={item.item_name}
          placeholder="항목명"
          onBlur={(e) => {
            if (e.target.value !== item.item_name) onUpdate(item.id, 'item_name', e.target.value)
          }}
        />
      </td>
      <td className="px-3 py-2">
        <Input
          className="h-7 text-sm border-0 bg-transparent px-1 text-right focus-visible:ring-1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(formatAmountInput(e.target.value))}
          onBlur={handleAmountBlur}
          placeholder="0"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          className="h-7 text-sm border-0 bg-transparent px-1 focus-visible:ring-1"
          defaultValue={item.description ?? ''}
          placeholder="세부설명"
          onBlur={(e) => {
            if (e.target.value !== (item.description ?? ''))
              onUpdate(item.id, 'description', e.target.value)
          }}
        />
      </td>
      <td className="px-3 py-2">
        <Select
          value={item.payment_method ?? ''}
          onValueChange={(v) => onUpdate(item.id, 'payment_method', v as PaymentMethod)}
        >
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent px-1">
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2">
        <Select
          value={item.payer ?? ''}
          onValueChange={(v) => onUpdate(item.id, 'payer', v as Payer)}
        >
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent px-1">
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAYER_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2">
        <Input
          className="h-7 text-sm border-0 bg-transparent px-1 focus-visible:ring-1"
          defaultValue={isLiving ? (item.management_method ?? '') : (item.payment_detail ?? '')}
          placeholder={isLiving ? '카뱅-생활비통장' : '토스뱅크'}
          onBlur={(e) => {
            const field = isLiving ? 'management_method' : 'payment_detail'
            const cur = isLiving ? item.management_method : item.payment_detail
            if (e.target.value !== (cur ?? '')) onUpdate(item.id, field, e.target.value)
          }}
        />
      </td>
      {!isLiving && (
        <>
          <td className="px-3 py-2">
            <Input
              className="h-7 text-sm border-0 bg-transparent px-1 text-center focus-visible:ring-1"
              inputMode="numeric"
              defaultValue={item.payout_date ?? ''}
              placeholder="일"
              maxLength={2}
              onBlur={(e) => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v !== item.payout_date) onUpdate(item.id, 'payout_date', v)
              }}
            />
          </td>
          <td className="px-3 py-2">
            <Input
              className="h-7 text-sm border-0 bg-transparent px-1 text-center focus-visible:ring-1"
              inputMode="numeric"
              defaultValue={item.billing_date ?? ''}
              placeholder="일"
              maxLength={2}
              onBlur={(e) => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v !== item.billing_date) onUpdate(item.id, 'billing_date', v)
              }}
            />
          </td>
        </>
      )}
      <td className="px-3 py-2">
        <Select
          value={item.status}
          onValueChange={(v) => onUpdate(item.id, 'status', v as Status)}
        >
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2">
        <button
          className="text-gray-400 hover:text-red-500 transition-colors"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}

/* ─── 모바일 카드 ─── */
function MobileRow({ item, isLiving, onUpdate, onDelete }: RowProps) {
  const [amount, setAmount] = useState(item.amount > 0 ? item.amount.toLocaleString('ko-KR') : '')

  function handleAmountBlur() {
    const parsed = parseAmount(amount)
    if (parsed !== item.amount) onUpdate(item.id, 'amount', parsed)
  }

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          className="h-8 flex-1 font-medium"
          defaultValue={item.item_name}
          placeholder="항목명"
          onBlur={(e) => {
            if (e.target.value !== item.item_name) onUpdate(item.id, 'item_name', e.target.value)
          }}
        />
        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
        <button
          className="text-gray-400 hover:text-red-500 shrink-0"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <Input
          className="h-8 text-right flex-1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(formatAmountInput(e.target.value))}
          onBlur={handleAmountBlur}
          placeholder="0원"
        />
        <Select
          value={item.payer ?? ''}
          onValueChange={(v) => onUpdate(item.id, 'payer', v as Payer)}
        >
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue placeholder="납부자" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAYER_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        className="h-7 text-xs text-gray-500"
        defaultValue={item.description ?? ''}
        placeholder="세부설명"
        onBlur={(e) => {
          if (e.target.value !== (item.description ?? ''))
            onUpdate(item.id, 'description', e.target.value)
        }}
      />
    </div>
  )
}
