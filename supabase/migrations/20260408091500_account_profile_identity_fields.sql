-- Bring Account identity fields and avatar storage into source control.
-- Live Supabase already has these objects, so keep this migration idempotent.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', false)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can read their own avatar'
  ) then
    create policy "Users can read their own avatar"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload their own avatar'
  ) then
    create policy "Users can upload their own avatar"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update their own avatar'
  ) then
    create policy "Users can update their own avatar"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete their own avatar'
  ) then
    create policy "Users can delete their own avatar"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;
