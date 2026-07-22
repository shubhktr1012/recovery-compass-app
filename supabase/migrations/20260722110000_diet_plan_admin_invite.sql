-- Admin questionnaire invite links.
--
-- Ops can mint a claim link so a client fills the diet-plan questionnaire
-- without website payment or auto-generation. Generation stays manual in admin.

alter table public.diet_plan_orders
    drop constraint if exists diet_plan_orders_source_check;

alter table public.diet_plan_orders
    add constraint diet_plan_orders_source_check
    check (source in ('standalone', 'checkout_addon', 'admin_manual', 'admin_invite'));

create index if not exists idx_diet_plan_orders_invite_source_status
    on public.diet_plan_orders(source, status, created_at desc)
    where source = 'admin_invite';
