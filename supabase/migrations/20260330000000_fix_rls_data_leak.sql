-- SECURITY FIX: Remove permissive RLS policies that allowed any authenticated user
-- to view ALL non-draft invoices and invoice_items from other users' businesses.
--
-- The public invoice page (/invoice/[id]) uses createAnonClient() (anon role),
-- so the anon policies are sufficient for the shared link. The authenticated
-- policies were overly permissive and caused User B to see User A's invoices
-- when logged in and viewing the dashboard.
--
-- Affected: invoices, invoice_items
-- Quotations, products, clients: no similar bug (quotations only has anon for public view).

-- 1. Invoices: drop policy that let authenticated users see ALL non-draft invoices
DROP POLICY IF EXISTS "Public can view non-draft invoices (authenticated)" ON public.invoices;

-- 2. Invoice items: drop policy that let authenticated users see ALL items of non-draft invoices
DROP POLICY IF EXISTS "Public can view items of non-draft invoices (authenticated)" ON public.invoice_items;
