CREATE TABLE public.partner_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  email text,
  phone text,
  partner_type text NOT NULL CHECK (partner_type IN ('coach', 'mentor', 'nutritionist')),
  referral_code text NOT NULL UNIQUE CHECK (referral_code ~ '^[A-Z0-9]{3,32}$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  discount_pct numeric(5,2) NOT NULL DEFAULT 10.00 CHECK (discount_pct > 0 AND discount_pct <= 100),
  commission_pct numeric(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_pct > 0 AND commission_pct <= 100),
  expires_at timestamptz,
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  notes text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_referrals_matching_rates CHECK (discount_pct = commission_pct)
);

CREATE UNIQUE INDEX partner_referrals_email_lower_unique
  ON public.partner_referrals (lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX partner_referrals_status_idx
  ON public.partner_referrals (status, created_at DESC);

CREATE TRIGGER set_partner_referrals_updated_at
  BEFORE UPDATE ON public.partner_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.partner_referrals FROM anon, authenticated;
GRANT ALL ON TABLE public.partner_referrals TO service_role;

CREATE POLICY "Service role manages partner referrals"
  ON public.partner_referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.referral_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_referral_id uuid NOT NULL REFERENCES public.partner_referrals(id) ON DELETE RESTRICT,
  transaction_id uuid NOT NULL UNIQUE REFERENCES public.transactions(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  referral_code_snapshot text NOT NULL,
  partner_name_snapshot text NOT NULL,
  original_amount_paise integer NOT NULL CHECK (original_amount_paise > 0),
  discount_amount_paise integer NOT NULL CHECK (discount_amount_paise > 0),
  final_amount_paise integer NOT NULL CHECK (final_amount_paise > 0),
  commission_amount_paise integer NOT NULL CHECK (commission_amount_paise = discount_amount_paise),
  redemption_status text NOT NULL DEFAULT 'active' CHECK (redemption_status IN ('active', 'cancelled', 'refunded')),
  payout_status text NOT NULL DEFAULT 'unpaid' CHECK (payout_status IN ('unpaid', 'paid')),
  paid_at timestamptz,
  paid_by text,
  payout_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_redemptions_amount_math CHECK (
    final_amount_paise = original_amount_paise - discount_amount_paise
  ),
  CONSTRAINT referral_redemptions_paid_fields CHECK (
    (payout_status = 'unpaid' AND paid_at IS NULL AND paid_by IS NULL)
    OR (payout_status = 'paid' AND paid_at IS NOT NULL AND paid_by IS NOT NULL)
  )
);

CREATE INDEX referral_redemptions_partner_status_idx
  ON public.referral_redemptions (partner_referral_id, redemption_status, payout_status, created_at DESC);

CREATE INDEX referral_redemptions_created_at_idx
  ON public.referral_redemptions (created_at DESC);

CREATE TRIGGER set_referral_redemptions_updated_at
  BEFORE UPDATE ON public.referral_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.referral_redemptions FROM anon, authenticated;
GRANT ALL ON TABLE public.referral_redemptions TO service_role;

CREATE POLICY "Service role manages referral redemptions"
  ON public.referral_redemptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

