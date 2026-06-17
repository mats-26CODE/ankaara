-- Product sales performance report RPC + Pro/Business plan feature gate.

-- =============================================================================
-- 1. PLAN FEATURE: product_sales_reports (Pro + Business only)
-- =============================================================================
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'product_sales_reports', 'unlimited', NULL
FROM public.subscription_plans
WHERE plan_tier IN ('pro', 'business')
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type,
      limit_value = EXCLUDED.limit_value;

-- =============================================================================
-- 2. REQUIRE PLAN FEATURE (boolean gate via unlimited feature row)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.require_plan_feature(
  p_user_id uuid,
  p_feature_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_plan_id uuid;
  v_limit_type text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;

  SELECT s.subscription_plan_id INTO v_plan_id
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND (s.status IS NULL OR s.status = 'active')
    AND (s.end_date IS NULL OR s.end_date >= now())
  ORDER BY s.start_date DESC NULLS LAST
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE slug = 'free'
    LIMIT 1;
  END IF;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;

  SELECT f.limit_type INTO v_limit_type
  FROM public.subscription_plan_features f
  WHERE f.subscription_plan_id = v_plan_id
    AND f.feature_key = p_feature_key
  LIMIT 1;

  IF v_limit_type IS DISTINCT FROM 'unlimited' THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.require_plan_feature(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_plan_feature(uuid, text) TO authenticated;

-- =============================================================================
-- 3. PRODUCT SALES PERFORMANCE REPORT
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_product_sales_performance(
  p_business_id uuid,
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  sku text,
  units_sold numeric,
  revenue numeric,
  cogs numeric,
  profit numeric,
  sale_count bigint,
  is_orphan_line boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF p_business_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  PERFORM public.require_plan_feature(auth.uid(), 'product_sales_reports');

  RETURN QUERY
  SELECT
    si.product_id,
    COALESCE(
      NULLIF(BTRIM(p.name), ''),
      NULLIF(BTRIM(si.description), ''),
      'Unknown product'
    ) AS product_name,
    p.sku,
    COALESCE(SUM(si.quantity), 0)::numeric AS units_sold,
    COALESCE(SUM(si.total), 0)::numeric AS revenue,
    COALESCE(SUM(si.cost_total), 0)::numeric AS cogs,
    COALESCE(SUM(si.profit), 0)::numeric AS profit,
    COUNT(DISTINCT si.sale_id)::bigint AS sale_count,
    (si.product_id IS NULL) AS is_orphan_line
  FROM public.sale_items si
  INNER JOIN public.sales s ON s.id = si.sale_id
  LEFT JOIN public.products p ON p.id = si.product_id
  WHERE s.business_id = p_business_id
    AND si.item_type = 'product'
    AND (p_from_date IS NULL OR s.sale_date >= p_from_date)
    AND (p_to_date IS NULL OR s.sale_date <= p_to_date)
  GROUP BY
    si.product_id,
    COALESCE(
      NULLIF(BTRIM(p.name), ''),
      NULLIF(BTRIM(si.description), ''),
      'Unknown product'
    ),
    p.sku
  ORDER BY revenue DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_product_sales_performance(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_product_sales_performance(uuid, date, date) TO authenticated;

COMMENT ON FUNCTION public.get_product_sales_performance IS
  'Aggregates product line sales by product (or sale line description when product was deleted). Pro/Business only.';
