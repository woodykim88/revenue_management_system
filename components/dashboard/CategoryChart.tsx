'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { BudgetSummary } from '@/lib/types'
import { formatKRW } from '@/lib/format'

const COLORS = ['#22c55e', '#3b82f6', '#f97316']
const LABELS = ['저축비', '고정비', '생활비']

interface CategoryChartProps {
  summary: BudgetSummary
}

export function CategoryChart({ summary }: CategoryChartProps) {
  const data = [
    { name: '저축비', value: summary.savingsTotal, ratio: summary.savingsRatio },
    { name: '고정비', value: summary.fixedTotal, ratio: summary.fixedRatio },
    { name: '생활비', value: summary.livingTotal, ratio: summary.livingRatio },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        항목을 추가하면 차트가 표시됩니다
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[LABELS.indexOf(entry.name)]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatKRW(Number(value))}
            labelFormatter={(label) => label}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '저축비', value: summary.savingsTotal, ratio: summary.savingsRatio, color: '#22c55e' },
          { label: '고정비', value: summary.fixedTotal, ratio: summary.fixedRatio, color: '#3b82f6' },
          { label: '생활비', value: summary.livingTotal, ratio: summary.livingRatio, color: '#f97316' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-1"
              style={{ backgroundColor: item.color }}
            />
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-xs font-semibold">{item.ratio.toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
