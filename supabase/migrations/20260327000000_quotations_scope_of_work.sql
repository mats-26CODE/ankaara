-- Add scope_of_work to quotations for quotation-specific deliverables description.
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS scope_of_work text;

COMMENT ON COLUMN public.quotations.scope_of_work IS 'Optional: description of deliverables/scope for the quotation.';
