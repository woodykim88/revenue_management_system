'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MonthNav } from '@/components/MonthNav'
import { IncomeSection } from '@/components/budget/IncomeSection'
import { BudgetTable } from '@/components/budget/BudgetTable'
import { BudgetSaveStatus } from '@/components/budget/BudgetSaveStatus'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { PersonalSummary } from '@/components/dashboard/PersonalSummary'
import { ScheduleView } from '@/components/ScheduleView'
import { useBudgetSummary } from '@/hooks/useBudgetSummary'
import { useBudgetDraft } from '@/hooks/useBudgetDraft'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import type { HouseholdMonth, PlannedExpense } from '@/lib/types'
import { toast } from 'sonner'
import { formatKRW } from '@/lib/format'

type Tab = 'dashboard' | 'budget' | 'schedule'

function getCurrentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function addMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function HomePage() {
  const router = useRouter()
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth)
  const [month, setMonth] = useState<HouseholdMonth | null>(null)
  const [expenses, setExpenses] = useState<PlannedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)

  // 예산편성 탭 통합 저장 상태
  const draft = useBudgetDraft()

  // IncomeSection의 "지금 저장" 함수를 바깥에서 호출하기 위한 ref
  const incomeSaveNowRef = useRef<(() => Promise<void>) | null>(null)

  const summary = useBudgetSummary(expenses, month?.total_income ?? 0)

  const loadMonth = useCallback(async (ym: string) => {
    setLoading(true)
    const supabase = createClient()

    const { data: monthData } = await supabase
      .from('household_months')
      .select('*')
      .eq('year_month', ym)
      .single()

    if (monthData) {
      setMonth(monthData as HouseholdMonth)
      const { data: expData } = await supabase
        .from('planned_expenses')
        .select('*')
        .eq('month_id', monthData.id)
        .order('category')
        .order('sort_order')
      setExpenses((expData as PlannedExpense[]) ?? [])
      setCopyDialogOpen(false)
    } else {
      setMonth(null)
      setExpenses([])
      setCopyDialogOpen(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMonth(yearMonth)
  }, [yearMonth, loadMonth])

  async function createEmptyMonth() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('household_months')
      .insert({ year_month: yearMonth, salary_a: 0, salary_b: 0 })
      .select()
      .single()

    if (error) {
      toast.error('월 생성 실패')
    } else {
      setMonth(data as HouseholdMonth)
      setExpenses([])
      setCopyDialogOpen(false)
    }
  }

  async function copyFromPrevMonth() {
    const supabase = createClient()
    const prevYm = addMonths(yearMonth, -1)

    const { data: prevMonth } = await supabase
      .from('household_months')
      .select('*')
      .eq('year_month', prevYm)
      .single()

    if (!prevMonth) {
      toast.error('이전 달 데이터가 없습니다')
      return
    }

    const { data: newMonth, error: monthErr } = await supabase
      .from('household_months')
      .insert({ year_month: yearMonth, salary_a: 0, salary_b: 0 })
      .select()
      .single()

    if (monthErr || !newMonth) {
      toast.error('월 생성 실패')
      return
    }

    const { data: prevItems } = await supabase
      .from('planned_expenses')
      .select('*')
      .eq('month_id', prevMonth.id)

    if (prevItems && prevItems.length > 0) {
      const newItems = prevItems.map(
        ({
          id: _id,
          month_id: _mid,
          created_at: _c,
          updated_at: _u,
          ...rest
        }: PlannedExpense & {
          id: string
          month_id: string
          created_at: string
          updated_at: string
        }) => ({
          ...rest,
          month_id: newMonth.id,
          status: 'planned' as const,
        })
      )
      await supabase.from('planned_expenses').insert(newItems)
    }

    toast.success('이전 달에서 복사했습니다')
    setCopyDialogOpen(false)
    loadMonth(yearMonth)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // "지금 저장" 버튼: income debounce flush
  async function handleManualSave() {
    if (incomeSaveNowRef.current) {
      await incomeSaveNowRef.current()
    }
  }

  const categoryExpenses = (cat: 'savings' | 'fixed' | 'living') =>
    expenses.filter((e) => e.category === cat)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900">💰 가계부</span>
            <MonthNav
              yearMonth={yearMonth}
              onPrev={() => setYearMonth((ym) => addMonths(ym, -1))}
              onNext={() => setYearMonth((ym) => addMonths(ym, 1))}
            />
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="로그아웃"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {/* 탭 */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-2">
          {(['dashboard', 'budget', 'schedule'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === t
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t === 'dashboard' ? '대시보드' : t === 'budget' ? '예산 편성' : '결제 일정'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* 새 달 생성 다이얼로그 */}
        {copyDialogOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <h2 className="font-bold text-lg text-gray-900 mb-2">새 달 시작</h2>
              <p className="text-sm text-gray-500 mb-5">
                {yearMonth} 예산이 없습니다. 어떻게 시작할까요?
              </p>
              <div className="space-y-2">
                <Button className="w-full" onClick={copyFromPrevMonth}>
                  이전 달에서 복사
                </Button>
                <Button variant="outline" className="w-full" onClick={createEmptyMonth}>
                  빈 상태로 시작
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── 대시보드 탭 ── */}
        {tab === 'dashboard' && month && (
          <>
            <SummaryCards totalIncome={month.total_income} summary={summary} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">카테고리 비중</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryChart summary={summary} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">개인별 부담</CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalSummary summary={summary} />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">📅 다가오는 결제 (D-7)</CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingPayments expenses={expenses} />
              </CardContent>
            </Card>
          </>
        )}

        {/* ── 예산 편성 탭 ── */}
        {tab === 'budget' && month && (
          <>
            {/* 저장 상태 바 (항상 상단 고정) */}
            <div className="sticky top-[88px] z-10">
              <BudgetSaveStatus
                status={draft.saveStatus}
                lastSavedAt={draft.lastSavedAt}
                saveError={draft.saveError}
                onSave={handleManualSave}
              />
            </div>

            {/* 수입 섹션 */}
            <IncomeSection
              month={month}
              onUpdate={setMonth}
              onDirty={draft.markDirty}
              onSaving={draft.markSaving}
              onSaved={draft.markSaved}
              onError={draft.markError}
              saveNowRef={incomeSaveNowRef}
            />

            {/* 카테고리별 예산 테이블 */}
            {(['savings', 'fixed', 'living'] as const).map((cat) => (
              <BudgetTable
                key={cat}
                category={cat}
                monthId={month.id}
                items={categoryExpenses(cat)}
                onItemsChange={(updated) =>
                  setExpenses((prev) => [
                    ...prev.filter((e) => e.category !== cat),
                    ...updated,
                  ])
                }
                onDirty={draft.markDirty}
                onSaving={draft.markSaving}
                onSaved={draft.markSaved}
                onError={draft.markError}
              />
            ))}
          </>
        )}

        {/* ── 결제 일정 탭 ── */}
        {tab === 'schedule' && month && (
          <ScheduleView expenses={expenses} onItemsChange={setExpenses} />
        )}
      </main>
    </div>
  )
}

function UpcomingPayments({ expenses }: { expenses: PlannedExpense[] }) {
  const today = new Date().getDate()
  const upcoming = expenses
    .filter(
      (e) =>
        e.billing_date != null &&
        e.status !== 'done' &&
        e.billing_date >= today &&
        e.billing_date <= today + 7
    )
    .sort((a, b) => (a.billing_date ?? 0) - (b.billing_date ?? 0))
    .slice(0, 5)

  if (upcoming.length === 0) {
    return <p className="text-sm text-gray-400">D-7 이내 결제 항목이 없습니다.</p>
  }

  return (
    <div className="space-y-1">
      {upcoming.map((item) => (
        <div key={item.id} className="flex items-center justify-between text-sm py-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-medium tabular-nums w-10">
              {item.billing_date}일
            </span>
            <span className="text-gray-800">{item.item_name}</span>
          </div>
          <span className="font-semibold text-gray-900 tabular-nums">{formatKRW(item.amount)}</span>
        </div>
      ))}
    </div>
  )
}
