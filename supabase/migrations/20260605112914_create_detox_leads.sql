create table if not exists public.detox_leads (
  id uuid not null default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  primary_focus text not null default 'General Wellness',
  questionnaire_data jsonb not null default '{}'::jsonb,
  source text not null,
  email_consent boolean not null default true,
  whatsapp_consent boolean not null default true,
  lead_stage text not null default 'contact_captured',
  pdf_storage_path text,
  pdf_url_expires_at timestamp with time zone,
  email_status text not null default 'pending',
  email_provider_id text,
  email_last_error text,
  whatsapp_status text not null default 'pending',
  whatsapp_provider text not null default 'periskope',
  whatsapp_queue_id text,
  whatsapp_last_error text,
  overall_status text not null default 'lead_created',
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint detox_leads_pkey primary key (id)
);

alter table public.detox_leads
  add column if not exists email_consent boolean not null default true,
  add column if not exists whatsapp_consent boolean not null default true,
  add column if not exists lead_stage text not null default 'contact_captured',
  add column if not exists pdf_storage_path text,
  add column if not exists pdf_url_expires_at timestamp with time zone,
  add column if not exists email_status text not null default 'pending',
  add column if not exists email_provider_id text,
  add column if not exists email_last_error text,
  add column if not exists whatsapp_status text not null default 'pending',
  add column if not exists whatsapp_provider text not null default 'periskope',
  add column if not exists whatsapp_queue_id text,
  add column if not exists whatsapp_last_error text,
  add column if not exists overall_status text not null default 'lead_created',
  add column if not exists completed_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone not null default now();

create index if not exists idx_detox_leads_email on public.detox_leads(email);
create index if not exists idx_detox_leads_phone on public.detox_leads(phone);
create index if not exists idx_detox_leads_created_at on public.detox_leads(created_at desc);
create index if not exists idx_detox_leads_overall_status on public.detox_leads(overall_status);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'detox-pdfs',
  'detox-pdfs',
  false,
  5242880,
  array['application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.detox_leads enable row level security;

drop policy if exists "Allow public lead inserts" on public.detox_leads;
drop policy if exists "Allow service role read access" on public.detox_leads;
drop policy if exists "detox leads are backend only" on public.detox_leads;

create policy "detox leads are backend only"
  on public.detox_leads
  for all
  to service_role
  using (true)
  with check (true);
