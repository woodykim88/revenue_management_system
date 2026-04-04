export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function formatKRWShort(amount: number): string {
  return amount.toLocaleString('ko-KR')
}

export function parseAmount(value: string): number {
  return parseInt(value.replace(/,/g, ''), 10) || 0
}

export function formatAmountInput(value: string): string {
  const numeric = value.replace(/[^0-9]/g, '')
  if (!numeric) return ''
  return parseInt(numeric, 10).toLocaleString('ko-KR')
}

export const CATEGORY_LABELS = {
  savings: '저축비',
  fixed: '고정비',
  living: '생활비',
} as const

export const PAYMENT_METHOD_LABELS = {
  auto_transfer: '자동이체',
  card: '카드결제',
  bank_transfer: '계좌이체',
  direct: '직접',
} as const

export const PAYER_LABELS = {
  jongwoo: '종우',
  jihye: '지혜',
  both: '공동',
} as const

export const STATUS_LABELS = {
  planned: '예정',
  done: '완료',
  hold: '보류',
} as const
