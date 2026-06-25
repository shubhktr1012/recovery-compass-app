create table if not exists public.complete_plan_consultation_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  phone text,
  name text,
  entry_point text not null default 'unknown',
  recommended_program text,
  primary_concern text,
  questionnaire_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_complete_plan_consultation_leads_user_id
  on public.complete_plan_consultation_leads(user_id);

create index if not exists idx_complete_plan_consultation_leads_email
  on public.complete_plan_consultation_leads(email);

create index if not exists idx_complete_plan_consultation_leads_created_at
  on public.complete_plan_consultation_leads(created_at desc);

alter table public.complete_plan_consultation_leads enable row level security;

drop policy if exists "Service role manages complete plan consultation leads"
  on public.complete_plan_consultation_leads;

create policy "Service role manages complete plan consultation leads"
  on public.complete_plan_consultation_leads
  for all
  to service_role
  using (true)
  with check (true);
