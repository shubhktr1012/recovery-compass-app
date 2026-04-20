BEGIN;

-- Guardrail: once onboarding is complete, do not allow accidental regression
-- back to onboarding_complete = false from app/client writes.
-- Also ensure onboarding_completed_at is populated whenever onboarding_complete is true.

CREATE OR REPLACE FUNCTION public.prevent_profiles_onboarding_regression()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.onboarding_complete IS TRUE
     AND NEW.onboarding_complete IS DISTINCT FROM TRUE THEN
    NEW.onboarding_complete := TRUE;
    NEW.onboarding_completed_at :=
      COALESCE(OLD.onboarding_completed_at, NEW.onboarding_completed_at, NOW());
  END IF;

  IF NEW.onboarding_complete IS TRUE
     AND NEW.onboarding_completed_at IS NULL THEN
    NEW.onboarding_completed_at := COALESCE(OLD.onboarding_completed_at, NOW());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_onboarding_regression ON public.profiles;

CREATE TRIGGER trg_profiles_prevent_onboarding_regression
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profiles_onboarding_regression();

COMMIT;
