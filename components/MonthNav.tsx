'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MonthNavProps {
  yearMonth: string  // "2026-04"
  onPrev: () => void
  onNext: () => void
}

export function MonthNav({ yearMonth, onPrev, onNext }: MonthNavProps) {
  const [year, month] = yearMonth.split('-')
  const label = `${year}년 ${parseInt(month)}월`

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="font-semibold text-gray-900 min-w-[120px] text-center">{label}</span>
      <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
