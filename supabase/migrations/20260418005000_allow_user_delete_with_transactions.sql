-- Allow auth user deletion even when commerce transactions exist.
-- We keep transactions for audit/compliance and de-identify by nulling `user_id`
-- when the auth user is deleted.

DO $$
DECLARE
  constraint_row RECORD;
  user_id_not_null BOOLEAN;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
  ) THEN
    RETURN;
  END IF;

  -- Drop any existing FK from transactions.user_id -> auth.users.id (may be NO ACTION).
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid = 'public.transactions'::regclass
      AND confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;

  SELECT (is_nullable = 'NO')
  INTO user_id_not_null
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'user_id';

  IF user_id_not_null THEN
    EXECUTE 'ALTER TABLE public.transactions ALTER COLUMN user_id DROP NOT NULL';
  END IF;

  -- Re-add FK with ON DELETE SET NULL so account deletion succeeds without deleting transaction history.
  EXECUTE 'ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_auth_users_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL';
END;
$$;

