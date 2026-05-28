-- Keep invoice totals synced with loan outstanding balance.
-- This applies only to invoices generated from loans that are not yet converted to a sale.

CREATE OR REPLACE FUNCTION public.sync_loan_outstanding_to_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- If this invoice has already been converted to a sale, avoid mutating it.
  IF EXISTS (
    SELECT 1
    FROM public.sales s
    WHERE s.invoice_id = NEW.invoice_id
  ) THEN
    RETURN NEW;
  END IF;

  UPDATE public.invoices
  SET subtotal = NEW.outstanding_balance,
      tax = 0,
      tax_percentage = 0,
      total = NEW.outstanding_balance,
      status = CASE
        WHEN NEW.outstanding_balance = 0 THEN 'paid'
        ELSE status
      END,
      updated_at = now()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loans_sync_invoice_outstanding ON public.loans;
CREATE TRIGGER loans_sync_invoice_outstanding
  AFTER UPDATE OF outstanding_balance, invoice_id ON public.loans
  FOR EACH ROW
  WHEN (
    NEW.invoice_id IS NOT NULL
    AND (
      OLD.outstanding_balance IS DISTINCT FROM NEW.outstanding_balance
      OR OLD.invoice_id IS DISTINCT FROM NEW.invoice_id
    )
  )
  EXECUTE PROCEDURE public.sync_loan_outstanding_to_invoice();
