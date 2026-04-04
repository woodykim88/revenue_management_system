import { Card, CardContent } from '@/components/ui/card'
import { formatKRW } from '@/lib/format'
import type { BudgetSummary } from '@/lib/types'

interface SummaryCardsProps {
  totalIncome: number
  summary: BudgetSummary
}

export function SummaryCards({ totalIncome, summary }: SummaryCardsProps) {
  const cards = [
    { label: '총 월수입', value: totalIncome, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: '총 예상지출', value: summary.totalExpense, color: 'text-red-700', bg: 'bg-red-50' },
    { label: '총 저축액', value: summary.savingsTotal, color: 'text-green-700', bg: 'bg-green-50' },
    {
      label: '잔여예산',
      value: summary.remainingBudget,
      color: summary.remainingBudget >= 0 ? 'text-emerald-700' : 'text-red-700',
      bg: summary.remainingBudget >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className={`${card.bg} border-0 shadow-sm`}>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
            <p className={`text-lg font-bold ${card.color} leading-tight`}>
              {formatKRW(card.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
