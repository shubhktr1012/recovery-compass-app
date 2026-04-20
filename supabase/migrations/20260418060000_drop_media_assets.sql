BEGIN;

-- media_assets was introduced as a future-facing CMS/asset catalog, but the live
-- app currently references Storage objects directly (program day JSON storage paths
-- and profiles.avatar_url). Keeping this table adds unused surface area.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'media_assets'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Media assets are viewable by everyone" ON public.media_assets';
    EXECUTE 'DROP TABLE public.media_assets';
  END IF;
END;
$$;

COMMIT;
