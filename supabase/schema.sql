-- ============================================================
-- 부부 공동 가계부 DB 스키마 (WOO-6)
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 1. household_months 테이블
CREATE TABLE IF NOT EXISTS household_months (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month  text NOT NULL UNIQUE,  -- "2026-04" 형태
  salary_a    integer NOT NULL DEFAULT 0,  -- 종우 월급 (원)
  salary_b    integer NOT NULL DEFAULT 0,  -- 지혜 월급 (원)
  salary_b_note text,                      -- 지혜 월급 메모
  total_income integer GENERATED ALWAYS AS (salary_a + salary_b) STORED,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. planned_expenses 테이블
CREATE TABLE IF NOT EXISTS planned_expenses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id            uuid NOT NULL REFERENCES household_months(id) ON DELETE CASCADE,
  category            text NOT NULL CHECK (category IN ('savings', 'fixed', 'living')),
  sort_order          integer NOT NULL DEFAULT 0,
  item_name           text NOT NULL,
  amount              integer NOT NULL DEFAULT 0,
  description         text,
  payment_method      text CHECK (payment_method IN ('auto_transfer', 'card', 'bank_transfer', 'direct')),
  payer               text CHECK (payer IN ('jongwoo', 'jihye', 'both')),
  payment_detail      text,   -- 세부방법 (토스뱅크, 현대카드 등)
  payout_date         integer CHECK (payout_date BETWEEN 1 AND 31),
  billing_date        integer CHECK (billing_date BETWEEN 1 AND 31),
  management_method   text,   -- 생활비 전용 (카뱅-생활비통장 등)
  note                text,
  status              text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'hold')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_planned_expenses_month_category
  ON planned_expenses(month_id, category, sort_order);

CREATE INDEX IF NOT EXISTS idx_planned_expenses_billing_date
  ON planned_expenses(month_id, billing_date);

-- 4. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER household_months_updated_at
  BEFORE UPDATE ON household_months
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER planned_expenses_updated_at
  BEFORE UPDATE ON planned_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE household_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_expenses ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모두 읽기/쓰기 가능 (2인 전용 앱)
CREATE POLICY "authenticated users can do all on household_months"
  ON household_months FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can do all on planned_expenses"
  ON planned_expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
