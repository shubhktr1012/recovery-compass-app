alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists phone_verified_at timestamptz;

comment on column public.profiles.phone_number is
  'Optional user-provided contact phone number collected during onboarding. Not verified unless phone_verified_at is set.';

comment on column public.profiles.phone_verified_at is
  'Timestamp set only after a future OTP/provider verification flow confirms the phone number.';
