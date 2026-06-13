-- Admin-created diet plan orders.
--
-- This supports an ops flow where a client sends diet-plan information to the
-- admin directly, the admin collects payment with a Razorpay Payment Link, and
-- only then triggers the existing diet-plan generation pipeline.

alter table public.diet_plan_orders
    alter column razorpay_order_id drop not null;

alter table public.diet_plan_orders
    add column if not exists manual_payment_link_url text null,
    add column if not exists manual_payment_reference text null,
    add column if not exists manual_created_by text null,
    add column if not exists manual_payment_confirmed_at timestamptz null,
    add column if not exists manual_payment_confirmed_by text null,
    add column if not exists admin_notes text null;

alter table public.diet_plan_orders
    drop constraint if exists diet_plan_orders_status_check;

alter table public.diet_plan_orders
    add constraint diet_plan_orders_status_check
    check (
        status in (
            'awaiting_payment',
            'awaiting_questionnaire',
            'pending',
            'generating',
            'fulfilled',
            'failed'
        )
    );

alter table public.diet_plan_orders
    drop constraint if exists diet_plan_orders_source_check;

alter table public.diet_plan_orders
    add constraint diet_plan_orders_source_check
    check (source in ('standalone', 'checkout_addon', 'admin_manual'));

alter table public.diet_plan_orders
    drop constraint if exists diet_plan_orders_awaiting_payment_source_check;

alter table public.diet_plan_orders
    add constraint diet_plan_orders_awaiting_payment_source_check
    check (status <> 'awaiting_payment' or source = 'admin_manual');

alter table public.diet_plan_orders
    drop constraint if exists diet_plan_orders_manual_payment_link_url_check;

alter table public.diet_plan_orders
    add constraint diet_plan_orders_manual_payment_link_url_check
    check (
        manual_payment_link_url is null
        or (
            length(manual_payment_link_url) <= 2048
            and manual_payment_link_url ~* '^https://'
        )
    );

create index if not exists idx_diet_plan_orders_manual_source_status
    on public.diet_plan_orders(source, status, created_at desc)
    where source = 'admin_manual';
