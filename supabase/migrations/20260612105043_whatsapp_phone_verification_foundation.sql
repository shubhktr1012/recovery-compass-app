-- WhatsApp phone verification and message audit foundation.
--
-- The mobile app already captures public.profiles.phone_number during
-- onboarding. This migration keeps that as the source-of-truth phone field,
-- adds explicit WhatsApp consent/sync metadata, and stores OTP/message
-- provider state in backend-only tables.

alter table public.profiles
  add column if not exists whatsapp_service_consent_at timestamptz,
  add column if not exists whatsapp_service_consent_source text,
  add column if not exists whatsapp_marketing_consent_at timestamptz,
  add column if not exists whatsapp_opted_out_at timestamptz,
  add column if not exists whatsapp_periskope_contact_id text,
  add column if not exists whatsapp_last_synced_at timestamptz,
  add column if not exists whatsapp_last_delivery_error text;

comment on column public.profiles.whatsapp_service_consent_at is
  'Timestamp when the user opted in to WhatsApp service/transactional contact such as OTP and approved lifecycle templates.';

comment on column public.profiles.whatsapp_service_consent_source is
  'Where WhatsApp service consent was collected, for example onboarding, profile, or admin_import.';

comment on column public.profiles.whatsapp_marketing_consent_at is
  'Timestamp for explicit WhatsApp marketing/broadcast consent. Keep null until legal copy, templates, and opt-out flows are approved.';

comment on column public.profiles.whatsapp_opted_out_at is
  'Timestamp when the user opted out of WhatsApp contact. Server functions must respect this before sending non-essential messages.';

comment on column public.profiles.whatsapp_periskope_contact_id is
  'Optional external Periskope contact identifier for human sales/support inbox sync.';

comment on column public.profiles.whatsapp_last_synced_at is
  'Last successful sync timestamp with a WhatsApp CRM/inbox provider.';

comment on column public.profiles.whatsapp_last_delivery_error is
  'Last known WhatsApp delivery/sync error for support visibility.';

create table if not exists public.whatsapp_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_number text not null,
  purpose text not null default 'phone_verification'
    check (purpose in ('phone_verification')),
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'expired', 'cancelled', 'failed')),
  code_hash text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  expires_at timestamptz not null,
  verified_at timestamptz,
  last_sent_at timestamptz not null default now(),
  provider_message_id text,
  provider_response jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_otp_challenges_user_status_idx
  on public.whatsapp_otp_challenges (user_id, status, created_at desc);

create index if not exists whatsapp_otp_challenges_phone_created_idx
  on public.whatsapp_otp_challenges (phone_number, created_at desc);

drop trigger if exists set_whatsapp_otp_challenges_updated_at on public.whatsapp_otp_challenges;
create trigger set_whatsapp_otp_challenges_updated_at
  before update on public.whatsapp_otp_challenges
  for each row
  execute function public.set_updated_at();

alter table public.whatsapp_otp_challenges enable row level security;

drop policy if exists "Service role manages WhatsApp OTP challenges" on public.whatsapp_otp_challenges;
create policy "Service role manages WhatsApp OTP challenges"
  on public.whatsapp_otp_challenges
  for all
  to service_role
  using (true)
  with check (true);

revoke all on public.whatsapp_otp_challenges from anon;
revoke all on public.whatsapp_otp_challenges from authenticated;
grant all on public.whatsapp_otp_challenges to service_role;

create table if not exists public.whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  phone_number text not null,
  message_type text not null
    check (message_type in ('otp', 'template', 'lifecycle', 'support', 'marketing')),
  template_name text,
  consent_scope text not null default 'service'
    check (consent_scope in ('none', 'service', 'marketing')),
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  provider text not null default 'meta_cloud_api'
    check (provider in ('meta_cloud_api', 'periskope')),
  provider_message_id text,
  provider_response jsonb,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_message_logs_user_created_idx
  on public.whatsapp_message_logs (user_id, created_at desc);

create index if not exists whatsapp_message_logs_phone_created_idx
  on public.whatsapp_message_logs (phone_number, created_at desc);

create index if not exists whatsapp_message_logs_provider_message_idx
  on public.whatsapp_message_logs (provider, provider_message_id)
  where provider_message_id is not null;

drop trigger if exists set_whatsapp_message_logs_updated_at on public.whatsapp_message_logs;
create trigger set_whatsapp_message_logs_updated_at
  before update on public.whatsapp_message_logs
  for each row
  execute function public.set_updated_at();

alter table public.whatsapp_message_logs enable row level security;

drop policy if exists "Service role manages WhatsApp message logs" on public.whatsapp_message_logs;
create policy "Service role manages WhatsApp message logs"
  on public.whatsapp_message_logs
  for all
  to service_role
  using (true)
  with check (true);

revoke all on public.whatsapp_message_logs from anon;
revoke all on public.whatsapp_message_logs from authenticated;
grant all on public.whatsapp_message_logs to service_role;
