'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { formatAmountInput, parseAmount, formatKRW } from '@/lib/format'
import type { HouseholdMonth } from '@/lib/types'

interface IncomeSectionProps {
  month: HouseholdMonth
  onUpdate: (updated: HouseholdMonth) => void
  onDirty: () => void
  onSaving: () => void
  onSaved: () => void
  onError: (msg: string) => void
  /** 부모가 지금 바로 저장을 요청할 때 이 ref에 flush 함수를 등록함 */
  saveNowRef?: React.MutableRefObject<(() => Promise<void>) | null>
}

export function IncomeSection({
  month,
  onUpdate,
  onDirty,
  onSaving,
  onSaved,
  onError,
  saveNowRef,
}: IncomeSectionProps) {
  const [salaryA, setSalaryA] = useState(
    month.salary_a > 0 ? month.salary_a.toLocaleString('ko-KR') : ''
  )
  const [salaryB, setSalaryB] = useState(
    month.salary_b > 0 ? month.salary_b.toLocaleString('ko-KR') : ''
  )
  const [salaryBNote, setSalaryBNote] = useState(month.salary_b_note ?? '')
  const isDirtyRef = useRef(false)

  const parsedA = parseAmount(salaryA)
  const parsedB = parseAmount(salaryB)
  const totalIncome = parsedA + parsedB
  const ratioA = totalIncome > 0 ? (parsedA / totalIncome) * 100 : 50
  const ratioB = totalIncome > 0 ? (parsedB / totalIncome) * 100 : 50
  const ratioADisplay = totalIncome > 0 ? ratioA.toFixed(1) : '0.0'
  const ratioBDisplay = totalIncome > 0 ? ratioB.toFixed(1) : '0.0'

  const save = useCallback(
    async (a: number, b: number, note: string) => {
      if (!isDirtyRef.current) return
      isDirtyRef.current = false
      onSaving()
      const supabase = createClient()
      const { data, error } = await supabase
        .from('household_months')
        .update({ salary_a: a, salary_b: b, salary_b_note: note })
        .eq('id', month.id)
        .select()
        .single()

      if (error) {
        isDirtyRef.current = true // 실패 시 dirty 복구
        onError(error.message)
      } else if (data) {
        onUpdate(data as HouseholdMonth)
        onSaved()
      }
    },
    [month.id, onUpdate, onSaving, onSaved, onError]
  )

  // saveNowRef에 flush 함수 등록 (부모가 "지금 저장" 버튼 클릭 시 호출)
  useEffect(() => {
    if (saveNowRef) {
      saveNowRef.current = () => save(parsedA, parsedB, salaryBNote)
    }
  }, [saveNowRef, save, parsedA, parsedB, salaryBNote])

  // 1000ms 디바운스 자동저장
  useEffect(() => {
    if (!isDirtyRef.current) return
    const timer = setTimeout(() => {
      save(parsedA, parsedB, salaryBNote)
    }, 1000)
    return () => clearTimeout(timer)
  }, [salaryA, salaryB, salaryBNote, save, parsedA, parsedB])

  function handleChangeSalaryA(v: string) {
    setSalaryA(formatAmountInput(v))
    isDirtyRef.current = true
    onDirty()
  }

  function handleChangeSalaryB(v: string) {
    setSalaryB(formatAmountInput(v))
    isDirtyRef.current = true
    onDirty()
  }

  function handleChangeSalaryBNote(v: string) {
    setSalaryBNote(v)
    isDirtyRef.current = true
    onDirty()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">💵 월수입</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 월급 입력 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              종우 월급
            </label>
            <Input
              inputMode="numeric"
              value={salaryA}
              onChange={(e) => handleChangeSalaryA(e.target.value)}
              placeholder="0"
              className="text-right tabular-nums"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              지혜 월급
            </label>
            <Input
              inputMode="numeric"
              value={salaryB}
              onChange={(e) => handleChangeSalaryB(e.target.value)}
              placeholder="0"
              className="text-right tabular-nums"
            />
          </div>
        </div>

        {/* 기여 비율 바 */}
        {totalIncome > 0 && (
          <div>
            <div
              className="flex rounded-full overflow-hidden h-2"
              role="img"
              aria-label={`종우 ${ratioADisplay}%, 지혜 ${ratioBDisplay}%`}
            >
              <div
                className="bg-blue-400 transition-all duration-500"
                style={{ width: `${ratioA}%` }}
              />
              <div
                className="bg-rose-400 transition-all duration-500"
                style={{ width: `${ratioB}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-blue-600 font-medium">종우 {ratioADisplay}%</span>
              <span className="text-xs text-rose-600 font-medium">지혜 {ratioBDisplay}%</span>
            </div>
          </div>
        )}

        {/* 메모 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            지혜 월급 메모
          </label>
          <Input
            value={salaryBNote}
            onChange={(e) => handleChangeSalaryBNote(e.target.value)}
            placeholder="예: 월급여 430만 중 회사대출 115만 차감"
            className="text-sm"
          />
        </div>

        {/* 총 월수입 */}
        <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-blue-700">총 월수입</span>
          <span className="text-xl font-bold text-blue-900 tabular-nums">
            {formatKRW(totalIncome)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
