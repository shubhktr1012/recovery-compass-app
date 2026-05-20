-- Local integration schema for website flows.
-- The app local Supabase instance is the shared QA database, so website-only
-- commerce/contact tables are mirrored here with app-safe migration versions.

create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create table if not exists public.waitlist (
    id uuid not null default gen_random_uuid(),
    first_name text not null,
    last_name text not null,
    email text not null,
    phone text not null,
    country_code text not null,
    created_at timestamptz not null default now(),
    constraint waitlist_pkey primary key (id),
    constraint waitlist_email_unique unique (email)
);

alter table public.waitlist enable row level security;

drop policy if exists "Allow public inserts" on public.waitlist;
create policy "Allow public inserts"
    on public.waitlist
    for insert
    to anon
    with check (true);

drop policy if exists "Allow internal read access" on public.waitlist;
create policy "Allow internal read access"
    on public.waitlist
    for select
    to service_role
    using (true);

create table if not exists public.transactions (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    provider text not null default 'razorpay' check (provider in ('razorpay')),
    provider_order_id text not null,
    provider_payment_id text null,
    provider_signature text null,
    amount integer not null check (amount > 0),
    currency text not null default 'INR' check (currency in ('INR')),
    payment_status text not null default 'created'
        check (payment_status in ('created', 'paid', 'failed', 'refunded')),
    fulfillment_status text not null default 'pending'
        check (fulfillment_status in ('pending', 'fulfilled', 'fulfillment_failed')),
    items jsonb not null default '[]'::jsonb
        check (jsonb_typeof(items) = 'array'),
    metadata jsonb null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint transactions_pkey primary key (id),
    constraint uq_transactions_provider_order unique (provider, provider_order_id),
    constraint uq_transactions_provider_payment unique (provider, provider_payment_id)
);

create index if not exists idx_transactions_user_id
    on public.transactions(user_id);

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
    before update on public.transactions
    for each row
    execute function public.set_updated_at();

alter table public.transactions enable row level security;

drop policy if exists "Service role full access to transactions" on public.transactions;
create policy "Service role full access to transactions"
    on public.transactions
    for all
    to service_role
    using (true)
    with check (true);

create table if not exists public.enquiries (
    id uuid not null default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text not null,
    message text not null,
    created_at timestamptz not null default now(),
    constraint enquiries_pkey primary key (id)
);

alter table public.enquiries enable row level security;

drop policy if exists "Allow public enquiry inserts" on public.enquiries;
create policy "Allow public enquiry inserts"
    on public.enquiries
    for insert
    to anon
    with check (true);

drop policy if exists "Allow internal enquiry read access" on public.enquiries;
create policy "Allow internal enquiry read access"
    on public.enquiries
    for select
    to service_role
    using (true);

create table if not exists public.testimonials (
    id uuid not null default gen_random_uuid(),
    quote text not null check (length(btrim(quote)) > 0),
    display_name text not null check (length(btrim(display_name)) > 0),
    age integer check (age is null or age between 13 and 120),
    city text check (city is null or length(btrim(city)) > 0),
    program_slug text check (program_slug is null or length(btrim(program_slug)) > 0),
    source_type text not null default 'customer'
        check (source_type in ('customer', 'expert', 'sample')),
    consent_status text not null default 'pending'
        check (consent_status in ('pending', 'approved', 'rejected')),
    is_active boolean not null default false,
    is_featured_homepage boolean not null default false,
    sort_order integer not null default 100,
    internal_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint testimonials_pkey primary key (id)
);

create index if not exists idx_testimonials_homepage_feed
    on public.testimonials (sort_order, created_at desc)
    where is_active = true
      and is_featured_homepage = true
      and consent_status = 'approved';

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
    before update on public.testimonials
    for each row
    execute function public.set_updated_at();

alter table public.testimonials enable row level security;

drop policy if exists "Allow public reads of approved active testimonials" on public.testimonials;
create policy "Allow public reads of approved active testimonials"
    on public.testimonials
    for select
    using (is_active = true and consent_status = 'approved');

drop policy if exists "Service role full access to testimonials" on public.testimonials;
create policy "Service role full access to testimonials"
    on public.testimonials
    for all
    to service_role
    using (true)
    with check (true);

insert into public.testimonials (
    quote,
    display_name,
    age,
    city,
    program_slug,
    source_type,
    consent_status,
    is_active,
    is_featured_homepage,
    sort_order,
    internal_notes
)
select
    testimonial.quote,
    testimonial.display_name,
    testimonial.age,
    testimonial.city,
    testimonial.program_slug,
    testimonial.source_type,
    testimonial.consent_status,
    testimonial.is_active,
    testimonial.is_featured_homepage,
    testimonial.sort_order,
    testimonial.internal_notes
from (
    values
        (
            'I had been smoking for 11 years. Tried patches, tried cold turkey twice. The daily cards made it feel less like punishment and more like something I was actually doing for myself. 34 days now.',
            'Arjun M.',
            31,
            'Bengaluru',
            '90-day-smoke-free-journey',
            'sample',
            'approved',
            true,
            true,
            10,
            'Founder-provided sample testimonial copy for homepage rotation.'
        ),
        (
            'My husband noticed before I did. I was sleeping through the night for the first time in years. The program is quiet and consistent - no drama, just results.',
            'Sunita R.',
            44,
            'Pune',
            '90-day-smoke-free-journey',
            'sample',
            'approved',
            true,
            true,
            20,
            'Founder-provided sample testimonial copy for homepage rotation.'
        ),
        (
            'I used to set four alarms and still wake up exhausted. Two weeks in I was falling asleep before 11 without trying. Something actually shifted.',
            'Karan P.',
            28,
            'Mumbai',
            '21-day-deep-sleep-reset',
            'sample',
            'approved',
            true,
            true,
            30,
            'Founder-provided sample testimonial copy for homepage rotation.'
        ),
        (
            'As a working mother of two I had completely given up on sleeping well. This gave me a structure I could actually follow. Simple, not overwhelming.',
            'Priya N.',
            38,
            'Chennai',
            '21-day-deep-sleep-reset',
            'sample',
            'approved',
            true,
            true,
            40,
            'Founder-provided sample testimonial copy for homepage rotation.'
        ),
        (
            'I was skeptical because I''ve tried everything. By week three my colleague asked if I''d changed my skincare. I hadn''t - just the exercises and the sleep routine.',
            'Meera S.',
            42,
            'Delhi',
            'radiance-journey',
            'sample',
            'approved',
            true,
            true,
            50,
            'Founder-provided sample testimonial copy for homepage rotation.'
        ),
        (
            'The science explanations made me trust it. I''m not someone who does things without understanding why. 45 days in and my jawline is visibly different.',
            'Ananya K.',
            39,
            'Hyderabad',
            'radiance-journey',
            'sample',
            'approved',
            true,
            true,
            60,
            'Founder-provided sample testimonial copy for homepage rotation.'
        ),
        (
            'Worth every rupee. I keep recommending it to people and they don''t believe me until they try it.',
            'Rohit V.',
            35,
            'Ahmedabad',
            null,
            'sample',
            'approved',
            true,
            true,
            70,
            'Founder-provided sample testimonial copy for homepage rotation.'
        ),
        (
            'I downloaded it on a bad night and just started. That was 60 days ago.',
            'Divya T.',
            29,
            'Bangalore',
            null,
            'sample',
            'approved',
            true,
            true,
            80,
            'Founder-provided sample testimonial copy for homepage rotation.'
        )
) as testimonial(
    quote,
    display_name,
    age,
    city,
    program_slug,
    source_type,
    consent_status,
    is_active,
    is_featured_homepage,
    sort_order,
    internal_notes
)
where not exists (
    select 1
    from public.testimonials existing
    where existing.quote = testimonial.quote
      and existing.display_name = testimonial.display_name
);

create table if not exists public.outbound_email_deliveries (
    id uuid primary key default gen_random_uuid(),
    email_type text not null,
    dedupe_key text not null,
    user_id uuid null references auth.users(id) on delete set null,
    recipient_email text null,
    program_slug text null,
    provider text null,
    provider_event_id text null,
    provider_transaction_id text null,
    status text not null default 'pending'
        check (status in ('pending', 'sent', 'failed')),
    last_error text null,
    metadata jsonb null,
    sent_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint outbound_email_deliveries_dedupe_key_key unique (dedupe_key)
);

create index if not exists idx_outbound_email_deliveries_user_type
    on public.outbound_email_deliveries(user_id, email_type);

drop trigger if exists set_outbound_email_deliveries_updated_at on public.outbound_email_deliveries;
create trigger set_outbound_email_deliveries_updated_at
    before update on public.outbound_email_deliveries
    for each row
    execute function public.set_updated_at();

alter table public.outbound_email_deliveries enable row level security;

drop policy if exists "Service role full access to outbound_email_deliveries" on public.outbound_email_deliveries;
create policy "Service role full access to outbound_email_deliveries"
    on public.outbound_email_deliveries
    for all
    to service_role
    using (true)
    with check (true);

create table if not exists public.diet_plan_orders (
    id uuid not null default gen_random_uuid(),
    email text not null,
    name text null,
    razorpay_order_id text not null,
    razorpay_payment_id text null,
    razorpay_signature text null,
    amount integer not null default 129900,
    currency text not null default 'INR',
    questionnaire_data jsonb not null default '{}'::jsonb,
    status text not null default 'pending'
        check (status in ('awaiting_questionnaire', 'pending', 'generating', 'fulfilled', 'failed')),
    error_message text null,
    source text not null default 'standalone'
        check (source in ('standalone', 'checkout_addon')),
    source_transaction_id uuid null references public.transactions(id) on delete set null,
    claim_token_hash text null,
    claimed_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    fulfilled_at timestamptz null,
    constraint diet_plan_orders_pkey primary key (id),
    constraint uq_diet_plan_orders_razorpay_order unique (razorpay_order_id)
);

alter table public.diet_plan_orders
    alter column amount set default 129900;

create index if not exists idx_diet_plan_orders_email
    on public.diet_plan_orders(email);

create index if not exists idx_diet_plan_orders_status
    on public.diet_plan_orders(status);

create index if not exists idx_diet_plan_orders_source_transaction_id
    on public.diet_plan_orders(source_transaction_id);

create index if not exists idx_diet_plan_orders_claim_lookup
    on public.diet_plan_orders(id, claim_token_hash)
    where claim_token_hash is not null;

drop trigger if exists set_diet_plan_orders_updated_at on public.diet_plan_orders;
create trigger set_diet_plan_orders_updated_at
    before update on public.diet_plan_orders
    for each row
    execute function public.set_updated_at();

alter table public.diet_plan_orders enable row level security;

drop policy if exists "Service role full access to diet_plan_orders" on public.diet_plan_orders;
create policy "Service role full access to diet_plan_orders"
    on public.diet_plan_orders
    for all
    to service_role
    using (true)
    with check (true);
