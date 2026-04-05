'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error'

interface UseBudgetDraftReturn {
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  saveError: string | null
  markDirty: () => void
  markSaving: () => void
  markSaved: () => void
  markError: (msg: string) => void
}

/**
 * 예산편성 화면의 통합 저장 상태 관리 훅
 * - income, items 모두 이 훅을 통해 저장 상태를 보고
 * - 미저장 상태에서 페이지 이탈 방지
 * - 병렬 save op 카운터로 "모두 완료"를 감지
 */
export function useBudgetDraft(): UseBudgetDraftReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const savingCountRef = useRef(0)

  const markDirty = useCallback(() => {
    setSaveStatus('dirty')
    setSaveError(null)
  }, [])

  const markSaving = useCallback(() => {
    savingCountRef.current += 1
    setSaveStatus('saving')
  }, [])

  const markSaved = useCallback(() => {
    savingCountRef.current = Math.max(0, savingCountRef.current - 1)
    if (savingCountRef.current === 0) {
      setSaveStatus('saved')
      setLastSavedAt(new Date())
      setSaveError(null)
    }
  }, [])

  const markError = useCallback((msg: string) => {
    savingCountRef.current = Math.max(0, savingCountRef.current - 1)
    setSaveStatus('error')
    setSaveError(msg)
  }, [])

  // 페이지 이탈 보호: dirty / saving 상태에서 탭 닫기·새로고침 경고
  useEffect(() => {
    const isDirty = saveStatus === 'dirty' || saveStatus === 'saving'
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  return { saveStatus, lastSavedAt, saveError, markDirty, markSaving, markSaved, markError }
}
