-- Allow signed-in app users to create signed URLs for program audio objects.
-- Note: this is sufficient for app delivery, but it does mean any authenticated
-- user can read any object in this bucket if they know the path. Tighten this
-- later behind entitlement-aware server-side signing if stricter protection is needed.

insert into storage.buckets (id, name, public)
values ('program-audio', 'program-audio', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can read program audio'
  ) then
    create policy "Authenticated users can read program audio"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'program-audio');
  end if;
end
$$;
