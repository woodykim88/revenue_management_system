import { formatKRW } from '@/lib/format'
import type { BudgetSummary } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface PersonalSummaryProps {
  summary: BudgetSummary
}

export function PersonalSummary({ summary }: PersonalSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <p className="text-xs text-indigo-500 font-medium mb-1">종우 부담</p>
          <p className="text-base font-bold text-indigo-900">{formatKRW(summary.jongwooTotal)}</p>
        </div>
        <div className="bg-pink-50 rounded-lg p-3 text-center">
          <p className="text-xs text-pink-500 font-medium mb-1">지혜 부담</p>
          <p className="text-base font-bold text-pink-900">{formatKRW(summary.jihyeTotal)}</p>
        </div>
      </div>

      {summary.bothItems.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">공동 부담 항목</p>
          <div className="space-y-1">
            {summary.bothItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded"
              >
                <span className="text-gray-700">{item.item_name || '(항목명 없음)'}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatKRW(item.amount)}</span>
                  <Badge variant="secondary" className="text-xs">공동</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
