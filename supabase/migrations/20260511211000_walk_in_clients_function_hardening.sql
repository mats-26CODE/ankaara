-- Keep walk-in customer helper internals from being directly executable.

REVOKE ALL ON FUNCTION public.trg_clients_check_plan_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_businesses_ensure_walk_in_client() FROM PUBLIC, anon, authenticated;
