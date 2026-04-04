import { useMemo } from 'react'
import type { PlannedExpense, BudgetSummary } from '@/lib/types'

export function useBudgetSummary(
  expenses: PlannedExpense[],
  totalIncome: number
): BudgetSummary {
  return useMemo(() => {
    const savingsTotal = expenses
      .filter((e) => e.category === 'savings')
      .reduce((sum, e) => sum + e.amount, 0)

    const fixedTotal = expenses
      .filter((e) => e.category === 'fixed')
      .reduce((sum, e) => sum + e.amount, 0)

    const livingTotal = expenses
      .filter((e) => e.category === 'living')
      .reduce((sum, e) => sum + e.amount, 0)

    const totalExpense = savingsTotal + fixedTotal + livingTotal
    const remainingBudget = totalIncome - totalExpense

    const savingsRatio = totalExpense > 0 ? (savingsTotal / totalExpense) * 100 : 0
    const fixedRatio = totalExpense > 0 ? (fixedTotal / totalExpense) * 100 : 0
    const livingRatio = totalExpense > 0 ? (livingTotal / totalExpense) * 100 : 0

    const jongwooTotal = expenses
      .filter((e) => e.payer === 'jongwoo')
      .reduce((sum, e) => sum + e.amount, 0)

    const jihyeTotal = expenses
      .filter((e) => e.payer === 'jihye')
      .reduce((sum, e) => sum + e.amount, 0)

    const bothItems = expenses.filter((e) => e.payer === 'both')

    return {
      savingsTotal,
      fixedTotal,
      livingTotal,
      totalExpense,
      remainingBudget,
      savingsRatio,
      fixedRatio,
      livingRatio,
      jongwooTotal,
      jihyeTotal,
      bothItems,
    }
  }, [expenses, totalIncome])
}
