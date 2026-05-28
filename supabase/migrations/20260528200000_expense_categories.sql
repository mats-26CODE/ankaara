-- Expense categories: system defaults + per-business custom categories.

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_other boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expense_categories_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT expense_categories_other_requires_no_business CHECK (
    NOT is_other OR business_id IS NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_categories_business_name
  ON public.expense_categories (business_id, lower(trim(name)))
  WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_categories_system_name
  ON public.expense_categories (lower(trim(name)))
  WHERE business_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_expense_categories_business
  ON public.expense_categories (business_id, sort_order);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read expense categories for own businesses" ON public.expense_categories;
CREATE POLICY "Users can read expense categories for own businesses"
  ON public.expense_categories
  FOR SELECT
  USING (
    business_id IS NULL
    OR business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert expense categories for own businesses" ON public.expense_categories;
CREATE POLICY "Users can insert expense categories for own businesses"
  ON public.expense_categories
  FOR INSERT
  WITH CHECK (
    business_id IS NOT NULL
    AND is_other = false
    AND business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update expense categories for own businesses" ON public.expense_categories;
CREATE POLICY "Users can update expense categories for own businesses"
  ON public.expense_categories
  FOR UPDATE
  USING (
    business_id IS NOT NULL
    AND is_other = false
    AND business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND is_other = false
    AND business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete expense categories for own businesses" ON public.expense_categories;
CREATE POLICY "Users can delete expense categories for own businesses"
  ON public.expense_categories
  FOR DELETE
  USING (
    business_id IS NOT NULL
    AND is_other = false
    AND business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Optional link from expenses to a category row (custom "Other" text still stored in expenses.category).
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_category_id
  ON public.expenses(category_id)
  WHERE category_id IS NOT NULL;

-- System-wide default categories (business_id NULL).
INSERT INTO public.expense_categories (business_id, name, is_other, sort_order)
SELECT NULL, seed.name, seed.is_other, seed.sort_order
FROM (
  VALUES
    ('Rent', false, 10),
    ('Utilities', false, 20),
    ('Salaries & Wages', false, 30),
    ('Transport', false, 40),
    ('Supplies', false, 50),
    ('Marketing', false, 60),
    ('Maintenance', false, 70),
    ('Insurance', false, 80),
    ('Taxes & Fees', false, 90),
    ('Other', true, 999)
) AS seed(name, is_other, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.expense_categories existing
  WHERE existing.business_id IS NULL
    AND lower(trim(existing.name)) = lower(trim(seed.name))
);
