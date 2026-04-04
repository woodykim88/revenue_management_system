'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { formatAmountInput, parseAmount, formatKRW } from '@/lib/format'
import type { HouseholdMonth } from '@/lib/types'
import { toast } from 'sonner'

interface IncomeSectionProps {
  month: HouseholdMonth
  onUpdate: (updated: HouseholdMonth) => void
}

export function IncomeSection({ month, onUpdate }: IncomeSectionProps) {
  const [salaryA, setSalaryA] = useState(formatAmountInput(String(month.salary_a)))
  const [salaryB, setSalaryB] = useState(formatAmountInput(String(month.salary_b)))
  const [salaryBNote, setSalaryBNote] = useState(month.salary_b_note ?? '')
  const [saving, setSaving] = useState(false)

  const totalIncome = parseAmount(salaryA) + parseAmount(salaryB)
  const ratioA = totalIncome > 0 ? ((parseAmount(salaryA) / totalIncome) * 100).toFixed(1) : '0.0'
  const ratioB = totalIncome > 0 ? ((parseAmount(salaryB) / totalIncome) * 100).toFixed(1) : '0.0'

  const save = useCallback(async (a: number, b: number, note: string) => {
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('household_months')
      .update({ salary_a: a, salary_b: b, salary_b_note: note })
      .eq('id', month.id)
      .select()
      .single()

    if (error) {
      toast.error('저장 실패: ' + error.message)
    } else if (data) {
      onUpdate(data as HouseholdMonth)
    }
    setSaving(false)
  }, [month.id, onUpdate])

  useEffect(() => {
    const timer = setTimeout(() => {
      save(parseAmount(salaryA), parseAmount(salaryB), salaryBNote)
    }, 500)
    return () => clearTimeout(timer)
  }, [salaryA, salaryB, salaryBNote, save])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">💵 수입</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">종우 월급</label>
            <Input
              inputMode="numeric"
              value={salaryA}
              onChange={(e) => setSalaryA(formatAmountInput(e.target.value))}
              placeholder="0"
              className="text-right"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{ratioA}%</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">지혜 월급</label>
            <Input
              inputMode="numeric"
              value={salaryB}
              onChange={(e) => setSalaryB(formatAmountInput(e.target.value))}
              placeholder="0"
              className="text-right"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{ratioB}%</p>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium text-gray-700 block mb-1">지혜 월급 메모</label>
          <Input
            value={salaryBNote}
            onChange={(e) => setSalaryBNote(e.target.value)}
            placeholder="예: 월급여 430만 중 회사대출 115만 차감"
          />
        </div>
        <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-blue-700">총 월수입</span>
          <span className="text-xl font-bold text-blue-900">{formatKRW(totalIncome)}</span>
        </div>
        {saving && <p className="text-xs text-gray-400 mt-1 text-right">저장 중...</p>}
      </CardContent>
    </Card>
  )
}
