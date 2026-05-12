create or replace function public.ensure_single_primary_business()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_primary is true
      or not exists (
        select 1
        from public.businesses
        where owner_id = new.owner_id
          and is_primary
      )
    then
      new.is_primary := true;

      update public.businesses
      set is_primary = false,
          updated_at = now()
      where owner_id = new.owner_id
        and is_primary;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.is_primary is true
      and (old.is_primary is distinct from true or old.owner_id is distinct from new.owner_id)
    then
      update public.businesses
      set is_primary = false,
          updated_at = now()
      where owner_id = new.owner_id
        and id <> new.id
        and is_primary;
    elsif old.is_primary is true
      and new.is_primary is false
      and old.owner_id = new.owner_id
      and not exists (
        select 1
        from public.businesses
        where owner_id = new.owner_id
          and id <> new.id
          and is_primary
      )
    then
      new.is_primary := true;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.promote_primary_business_after_delete()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.is_primary then
    update public.businesses
    set is_primary = true,
        updated_at = now()
    where id = (
      select id
      from public.businesses
      where owner_id = old.owner_id
      order by created_at asc, id asc
      limit 1
    );
  end if;

  return old;
end;
$$;
