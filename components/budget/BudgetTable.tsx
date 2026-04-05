'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  onDirty: () => void
  onSaving: () => void
  onSaved: () => void
  onError: (msg: string) => void
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

const EMPTY_STATE_HINTS: Record<Category, string> = {
  savings: '아직 저축 항목이 없어요. 목돈·비상금 저축부터 추가해보세요.',
  fixed: '아직 고정비 항목이 없어요. 반복되는 지출부터 먼저 추가해보세요.',
  living: '아직 생활비 항목이 없어요. 매달 사용하는 생활비를 추가해보세요.',
}

const PAYER_BADGE: Record<Payer, { label: string; className: string }> = {
  jongwoo: { label: '종우', className: 'bg-blue-100 text-blue-700' },
  jihye: { label: '지혜', className: 'bg-rose-100 text-rose-700' },
  both: { label: '공동', className: 'bg-violet-100 text-violet-700' },
}

export function BudgetTable({
  category,
  monthId,
  items,
  onItemsChange,
  onDirty,
  onSaving,
  onSaved,
  onError,
}: BudgetTableProps) {
  const [addingRow, setAddingRow] = useState(false)
  // 행별 dirty/new 상태 (Set of id)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  const isLiving = category === 'living'

  const markRowDirty = useCallback(
    (id: string) => {
      setDirtyIds((prev) => new Set(prev).add(id))
      onDirty()
    },
    [onDirty]
  )

  const markRowClean = useCallback((id: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

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
      const newItem = data as PlannedExpense
      onItemsChange([...items, newItem])
      setNewIds((prev) => new Set(prev).add(newItem.id))
    }
    setAddingRow(false)
  }

  async function handleUpdateItem(id: string, field: string, value: string | number | null) {
    markRowDirty(id)
    onSaving()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('planned_expenses')
      .update({ [field]: value })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      onError(error.message)
    } else if (data) {
      onItemsChange(items.map((item) => (item.id === id ? (data as PlannedExpense) : item)))
      markRowClean(id)
      onSaved()
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
      setDirtyIds((prev) => { const n = new Set(prev); n.delete(id); return n })
      setNewIds((prev) => { const n = new Set(prev); n.delete(id); return n })
      toast.success('항목이 삭제됐어요')
    }
  }

  const colCount = isLiving ? 8 : 10

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* 카테고리 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
          <span className="font-semibold text-gray-900">{CATEGORY_LABELS_KR[category]}</span>
          <span className="text-xs text-gray-400 tabular-nums">({items.length}건)</span>
        </div>
        <span className="font-bold text-gray-900 tabular-nums">{formatKRW(total)}</span>
      </div>

      {/* 데스크탑 테이블 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/60 text-gray-500 text-xs">
              <th className="px-2 py-2 text-left font-medium w-4" aria-label="수정 상태" />
              <th className="px-3 py-2 text-left font-medium w-36">항목명</th>
              <th className="px-3 py-2 text-right font-medium w-28">예상금액</th>
              <th className="px-3 py-2 text-left font-medium">세부설명</th>
              <th className="px-3 py-2 text-left font-medium w-24">지출방법</th>
              <th className="px-3 py-2 text-left font-medium w-20">납부자</th>
              <th className="px-3 py-2 text-left font-medium w-24">
                {isLiving ? '관리통장' : '세부방법'}
              </th>
              {!isLiving && (
                <>
                  <th className="px-3 py-2 text-center font-medium w-14">지급일</th>
                  <th className="px-3 py-2 text-center font-medium w-14">납부일</th>
                </>
              )}
              <th className="px-3 py-2 text-center font-medium w-16">상태</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center">
                  <p className="text-gray-400 text-sm">{EMPTY_STATE_HINTS[category]}</p>
                </td>
              </tr>
            )}
            {items.map((item) => (
              <BudgetRow
                key={item.id}
                item={item}
                isLiving={isLiving}
                isDirty={dirtyIds.has(item.id)}
                isNew={newIds.has(item.id)}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                onFieldDirty={markRowDirty}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 목록 */}
      <div className="md:hidden divide-y">
        {items.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400 text-sm">
            {EMPTY_STATE_HINTS[category]}
          </p>
        )}
        {items.map((item) => (
          <MobileRow
            key={item.id}
            item={item}
            isLiving={isLiving}
            isDirty={dirtyIds.has(item.id)}
            isNew={newIds.has(item.id)}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onFieldDirty={markRowDirty}
          />
        ))}
      </div>

      {/* 항목 추가 버튼 */}
      <div className="px-4 py-3 border-t bg-gray-50/40">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-200 hover:border-blue-300 transition-colors"
          onClick={handleAddItem}
          disabled={addingRow}
          aria-label={`${CATEGORY_LABELS_KR[category]} 항목 추가`}
        >
          <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
          {addingRow ? '추가 중...' : '항목 추가'}
        </Button>
      </div>
    </div>
  )
}

/* ─── 행 공통 Props ─── */
interface RowProps {
  item: PlannedExpense
  isLiving: boolean
  isDirty: boolean
  isNew: boolean
  onUpdate: (id: string, field: string, value: string | number | null) => void
  onDelete: (id: string) => void
  onFieldDirty: (id: string) => void
}

/* ─── 데스크탑 행 ─── */
function BudgetRow({ item, isLiving, isDirty, isNew, onUpdate, onDelete, onFieldDirty }: RowProps) {
  const [amount, setAmount] = useState(item.amount > 0 ? item.amount.toLocaleString('ko-KR') : '')
  const amountDirtyRef = useRef(false)

  function handleAmountChange(v: string) {
    setAmount(formatAmountInput(v))
    if (!amountDirtyRef.current) {
      amountDirtyRef.current = true
      onFieldDirty(item.id)
    }
  }

  function handleAmountBlur() {
    if (!amountDirtyRef.current) return
    amountDirtyRef.current = false
    const parsed = parseAmount(amount)
    onUpdate(item.id, 'amount', parsed)
  }

  const payerBadge = item.payer ? PAYER_BADGE[item.payer] : null

  return (
    <tr
      className={`border-b transition-colors ${
        isDirty ? 'bg-amber-50/40' : 'hover:bg-gray-50/60'
      }`}
    >
      {/* 수정 상태 dot */}
      <td className="px-2 py-2">
        <div className="flex justify-center">
          {isNew ? (
            <span
              className="w-2 h-2 rounded-full bg-blue-400 shrink-0"
              title="새 항목"
              aria-label="새 항목"
            />
          ) : isDirty ? (
            <span
              className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
              title="수정됨 (저장 중)"
              aria-label="수정됨"
            />
          ) : null}
        </div>
      </td>

      {/* 항목명 */}
      <td className="px-3 py-2">
        <Input
          className="h-7 text-sm border-0 bg-transparent px-1 focus-visible:ring-1"
          defaultValue={item.item_name}
          placeholder="항목명"
          onFocus={() => onFieldDirty(item.id)}
          onBlur={(e) => {
            if (e.target.value !== item.item_name)
              onUpdate(item.id, 'item_name', e.target.value)
          }}
        />
      </td>

      {/* 예상금액 */}
      <td className="px-3 py-2">
        <Input
          className="h-7 text-sm border-0 bg-transparent px-1 text-right tabular-nums focus-visible:ring-1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          onBlur={handleAmountBlur}
          placeholder="0"
        />
      </td>

      {/* 세부설명 */}
      <td className="px-3 py-2">
        <Input
          className="h-7 text-sm border-0 bg-transparent px-1 focus-visible:ring-1 text-gray-500"
          defaultValue={item.description ?? ''}
          placeholder="메모"
          onFocus={() => onFieldDirty(item.id)}
          onBlur={(e) => {
            if (e.target.value !== (item.description ?? ''))
              onUpdate(item.id, 'description', e.target.value)
          }}
        />
      </td>

      {/* 지출방법 */}
      <td className="px-3 py-2">
        <Select
          value={item.payment_method ?? ''}
          onValueChange={(v) => {
            onFieldDirty(item.id)
            onUpdate(item.id, 'payment_method', v as PaymentMethod)
          }}
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

      {/* 납부자 */}
      <td className="px-3 py-2">
        <Select
          value={item.payer ?? ''}
          onValueChange={(v) => {
            onFieldDirty(item.id)
            onUpdate(item.id, 'payer', v as Payer)
          }}
        >
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent px-1">
            <SelectValue placeholder="선택">
              {payerBadge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${payerBadge.className}`}>
                  {payerBadge.label}
                </span>
              )}
            </SelectValue>
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

      {/* 세부방법 / 관리통장 */}
      <td className="px-3 py-2">
        <Input
          className="h-7 text-sm border-0 bg-transparent px-1 focus-visible:ring-1 text-gray-500"
          defaultValue={isLiving ? (item.management_method ?? '') : (item.payment_detail ?? '')}
          placeholder={isLiving ? '생활비통장' : '토스뱅크'}
          onFocus={() => onFieldDirty(item.id)}
          onBlur={(e) => {
            const field = isLiving ? 'management_method' : 'payment_detail'
            const cur = isLiving ? item.management_method : item.payment_detail
            if (e.target.value !== (cur ?? ''))
              onUpdate(item.id, field, e.target.value)
          }}
        />
      </td>

      {/* 지급일 / 납부일 (저축·고정만) */}
      {!isLiving && (
        <>
          <td className="px-3 py-2">
            <Input
              className="h-7 text-sm border-0 bg-transparent px-1 text-center tabular-nums focus-visible:ring-1"
              inputMode="numeric"
              defaultValue={item.payout_date ?? ''}
              placeholder="일"
              maxLength={2}
              onFocus={() => onFieldDirty(item.id)}
              onBlur={(e) => {
                const v = parseInt(e.target.value)
                const val = isNaN(v) ? null : v
                if (val !== item.payout_date) onUpdate(item.id, 'payout_date', val)
              }}
            />
          </td>
          <td className="px-3 py-2">
            <Input
              className="h-7 text-sm border-0 bg-transparent px-1 text-center tabular-nums focus-visible:ring-1"
              inputMode="numeric"
              defaultValue={item.billing_date ?? ''}
              placeholder="일"
              maxLength={2}
              onFocus={() => onFieldDirty(item.id)}
              onBlur={(e) => {
                const v = parseInt(e.target.value)
                const val = isNaN(v) ? null : v
                if (val !== item.billing_date) onUpdate(item.id, 'billing_date', val)
              }}
            />
          </td>
        </>
      )}

      {/* 상태 */}
      <td className="px-3 py-2">
        <Select
          value={item.status}
          onValueChange={(v) => {
            onFieldDirty(item.id)
            onUpdate(item.id, 'status', v as Status)
          }}
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

      {/* 삭제 */}
      <td className="px-3 py-2">
        <button
          className="text-gray-300 hover:text-red-500 transition-colors"
          onClick={() => onDelete(item.id)}
          aria-label={`${item.item_name || '항목'} 삭제`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}

/* ─── 모바일 카드 ─── */
function MobileRow({ item, isLiving, isDirty, isNew, onUpdate, onDelete, onFieldDirty }: RowProps) {
  const [amount, setAmount] = useState(item.amount > 0 ? item.amount.toLocaleString('ko-KR') : '')
  const amountDirtyRef = useRef(false)

  function handleAmountChange(v: string) {
    setAmount(formatAmountInput(v))
    if (!amountDirtyRef.current) {
      amountDirtyRef.current = true
      onFieldDirty(item.id)
    }
  }

  function handleAmountBlur() {
    if (!amountDirtyRef.current) return
    amountDirtyRef.current = false
    const parsed = parseAmount(amount)
    onUpdate(item.id, 'amount', parsed)
  }

  const payerBadge = item.payer ? PAYER_BADGE[item.payer] : null

  return (
    <div
      className={`px-4 py-3 space-y-2 transition-colors ${isDirty ? 'bg-amber-50/40' : ''}`}
    >
      {/* 항목명 + 뱃지 + 삭제 */}
      <div className="flex items-center gap-2">
        {/* 수정 상태 dot */}
        <div className="w-2 shrink-0">
          {isNew ? (
            <span className="block w-2 h-2 rounded-full bg-blue-400" aria-label="새 항목" />
          ) : isDirty ? (
            <span className="block w-2 h-2 rounded-full bg-amber-400" aria-label="수정됨" />
          ) : null}
        </div>
        <Input
          className="h-8 flex-1 font-medium text-sm"
          defaultValue={item.item_name}
          placeholder="항목명"
          onFocus={() => onFieldDirty(item.id)}
          onBlur={(e) => {
            if (e.target.value !== item.item_name)
              onUpdate(item.id, 'item_name', e.target.value)
          }}
        />
        {payerBadge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${payerBadge.className}`}
          >
            {payerBadge.label}
          </span>
        )}
        <button
          className="text-gray-300 hover:text-red-500 shrink-0 transition-colors"
          onClick={() => onDelete(item.id)}
          aria-label={`${item.item_name || '항목'} 삭제`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* 금액 + 납부자 선택 */}
      <div className="flex gap-2">
        <Input
          className="h-8 text-right flex-1 tabular-nums text-sm"
          inputMode="numeric"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          onBlur={handleAmountBlur}
          placeholder="0원"
        />
        <Select
          value={item.payer ?? ''}
          onValueChange={(v) => {
            onFieldDirty(item.id)
            onUpdate(item.id, 'payer', v as Payer)
          }}
        >
          <SelectTrigger className="h-8 w-20 text-xs shrink-0">
            <SelectValue placeholder="납부자" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAYER_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 메모 */}
      <Input
        className="h-7 text-xs text-gray-500"
        defaultValue={item.description ?? ''}
        placeholder="메모"
        onFocus={() => onFieldDirty(item.id)}
        onBlur={(e) => {
          if (e.target.value !== (item.description ?? ''))
            onUpdate(item.id, 'description', e.target.value)
        }}
      />
    </div>
  )
}
