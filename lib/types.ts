export type Category = 'savings' | 'fixed' | 'living'
export type PaymentMethod = 'auto_transfer' | 'card' | 'bank_transfer' | 'direct'
export type Payer = 'jongwoo' | 'jihye' | 'both'
export type Status = 'planned' | 'done' | 'hold'

export interface HouseholdMonth {
  id: string
  year_month: string
  salary_a: number
  salary_b: number
  salary_b_note: string | null
  total_income: number
  created_at: string
  updated_at: string
}

export interface PlannedExpense {
  id: string
  month_id: string
  category: Category
  sort_order: number
  item_name: string
  amount: number
  description: string | null
  payment_method: PaymentMethod | null
  payer: Payer | null
  payment_detail: string | null
  payout_date: number | null
  billing_date: number | null
  management_method: string | null
  note: string | null
  status: Status
  created_at: string
  updated_at: string
}

export interface BudgetSummary {
  savingsTotal: number
  fixedTotal: number
  livingTotal: number
  totalExpense: number
  remainingBudget: number
  savingsRatio: number
  fixedRatio: number
  livingRatio: number
  jongwooTotal: number
  jihyeTotal: number
  bothItems: PlannedExpense[]
}
