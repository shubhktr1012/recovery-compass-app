CREATE TABLE IF NOT EXISTS public.app_runtime_config (
  id text PRIMARY KEY DEFAULT 'production',
  is_enabled boolean NOT NULL DEFAULT true,
  min_supported_version_ios text NOT NULL DEFAULT '0.0.0',
  min_supported_version_android text NOT NULL DEFAULT '0.0.0',
  ios_store_url text NOT NULL DEFAULT 'https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102',
  android_store_url text NOT NULL DEFAULT 'https://play.google.com/store/apps/details?id=com.recoverycompass.app&hl=en_IN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_runtime_config_singleton_check CHECK (id = 'production'),
  CONSTRAINT app_runtime_config_ios_version_check
    CHECK (min_supported_version_ios ~ '^[0-9]+(\.[0-9]+){0,2}$'),
  CONSTRAINT app_runtime_config_android_version_check
    CHECK (min_supported_version_android ~ '^[0-9]+(\.[0-9]+){0,2}$'),
  CONSTRAINT app_runtime_config_ios_url_check
    CHECK (ios_store_url ~ '^https://'),
  CONSTRAINT app_runtime_config_android_url_check
    CHECK (android_store_url ~ '^https://')
);

DROP TRIGGER IF EXISTS trg_app_runtime_config_updated_at
  ON public.app_runtime_config;
CREATE TRIGGER trg_app_runtime_config_updated_at
  BEFORE UPDATE ON public.app_runtime_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.app_runtime_config ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.app_runtime_config TO anon;
GRANT SELECT ON public.app_runtime_config TO authenticated;

DROP POLICY IF EXISTS "Anyone can read active app runtime config"
  ON public.app_runtime_config;
CREATE POLICY "Anyone can read active app runtime config"
  ON public.app_runtime_config
  FOR SELECT
  TO anon, authenticated
  USING (is_enabled = true);

INSERT INTO public.app_runtime_config (
  id,
  is_enabled,
  min_supported_version_ios,
  min_supported_version_android,
  ios_store_url,
  android_store_url
)
VALUES (
  'production',
  true,
  '0.0.0',
  '0.0.0',
  'https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102',
  'https://play.google.com/store/apps/details?id=com.recoverycompass.app&hl=en_IN'
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.app_runtime_config IS
  'Single-row public runtime config for app release gates such as mandatory minimum supported versions.';
