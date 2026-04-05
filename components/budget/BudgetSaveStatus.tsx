'use client'

import { CheckCircle2, AlertCircle, Loader2, Save, CloudUpload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SaveStatus } from '@/hooks/useBudgetDraft'

interface BudgetSaveStatusProps {
  status: SaveStatus
  lastSavedAt: Date | null
  saveError: string | null
  onSave: () => void
}

function formatLastSaved(date: Date): string {
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffSec < 10) return '방금 저장됨'
  if (diffSec < 60) return `${diffSec}초 전 저장`
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `마지막 저장: 오늘 ${h}:${m}`
}

const STATUS_CONFIG: Record<
  SaveStatus,
  { icon: React.ElementType; text: string; color: string; bg: string; border: string; spin?: boolean }
> = {
  saved: {
    icon: CheckCircle2,
    text: '저장됨',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  saving: {
    icon: Loader2,
    text: '변경사항 저장 중...',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    spin: true,
  },
  dirty: {
    icon: CloudUpload,
    text: '저장되지 않은 변경사항',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  error: {
    icon: AlertCircle,
    text: '저장에 실패했어요. 다시 시도해주세요',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
}

export function BudgetSaveStatus({
  status,
  lastSavedAt,
  saveError,
  onSave,
}: BudgetSaveStatusProps) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  const isSaving = status === 'saving'
  const canSave = status === 'dirty' || status === 'error'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-colors ${cfg.bg} ${cfg.border}`}
      role="status"
      aria-live="polite"
      aria-label={`저장 상태: ${cfg.text}`}
    >
      {/* 상태 아이콘 + 텍스트 */}
      <div className={`flex items-center gap-1.5 flex-1 min-w-0 font-medium ${cfg.color}`}>
        <Icon
          className={`w-4 h-4 shrink-0 ${cfg.spin ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span className="truncate">{cfg.text}</span>
        {saveError && status === 'error' && (
          <span className="text-xs text-red-500 font-normal truncate hidden sm:inline">
            ({saveError})
          </span>
        )}
      </div>

      {/* 마지막 저장 시각 */}
      {lastSavedAt && status === 'saved' && (
        <span className="text-xs text-gray-400 shrink-0 tabular-nums">
          {formatLastSaved(lastSavedAt)}
        </span>
      )}

      {/* 저장 / 다시 시도 버튼 */}
      {canSave && (
        <Button
          size="sm"
          variant="outline"
          className={`h-7 text-xs shrink-0 font-medium ${
            status === 'error'
              ? 'border-red-300 text-red-700 hover:bg-red-100'
              : 'border-amber-300 text-amber-800 hover:bg-amber-100'
          }`}
          onClick={onSave}
          disabled={isSaving}
          aria-label={status === 'error' ? '저장 다시 시도' : '지금 저장'}
        >
          <Save className="w-3 h-3 mr-1" aria-hidden="true" />
          {status === 'error' ? '다시 시도' : '지금 저장'}
        </Button>
      )}
    </div>
  )
}
