-- RPC for clients to accept a quotation from the public shared link.
-- Anon users can call this; the function validates and updates status.
CREATE OR REPLACE FUNCTION public.accept_quotation(p_quotation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_valid_until date;
BEGIN
  SELECT status, valid_until INTO v_status, v_valid_until
  FROM quotations WHERE id = p_quotation_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Only sent or viewed quotations can be accepted
  IF v_status NOT IN ('sent', 'viewed') THEN
    RETURN false;
  END IF;

  -- Optional: reject if past valid_until (business rule)
  IF v_valid_until IS NOT NULL AND v_valid_until < CURRENT_DATE THEN
    RETURN false;
  END IF;

  UPDATE quotations SET status = 'accepted', updated_at = now()
  WHERE id = p_quotation_id;

  RETURN true;
END;
$$;

-- Allow anon to execute (for public shared link)
GRANT EXECUTE ON FUNCTION public.accept_quotation(uuid) TO anon;

COMMENT ON FUNCTION public.accept_quotation(uuid) IS 'Client accepts quotation from public link. Only works for sent/viewed, not expired.';
