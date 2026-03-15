-- Resolve "function check_plan_limit(uuid, unknown) is not unique":
-- Keep only the 3-arg version (with p_context). Triggers that call with 2 args use the default NULL.

DROP FUNCTION IF EXISTS public.check_plan_limit(uuid, text);
