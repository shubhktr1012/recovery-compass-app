BEGIN;

WITH normalized AS (
  SELECT
    pd.id,
    TRIM(REGEXP_REPLACE(pd.day_title, '\\s+', ' ', 'g')) AS trimmed_title
  FROM public.program_days pd
),
cleaned AS (
  SELECT
    id,
    REGEXP_REPLACE(trimmed_title, '\\s+goal(?:\\s+of\\s+today)?\\s*$', '', 'i') AS cleaned_title
  FROM normalized
),
final_titles AS (
  SELECT
    id,
    CASE
      WHEN cleaned_title ~ '[A-Za-z]' AND cleaned_title = UPPER(cleaned_title)
        THEN INITCAP(LOWER(cleaned_title))
      ELSE cleaned_title
    END AS normalized_title
  FROM cleaned
),
updated_rows AS (
  UPDATE public.program_days pd
  SET
    day_title = ft.normalized_title,
    title = CONCAT('Day ', pd.day_number, ' - ', ft.normalized_title),
    cards = CASE
      WHEN JSONB_TYPEOF(pd.cards) = 'array' THEN (
        SELECT JSONB_AGG(
          CASE
            WHEN elem->>'type' = 'intro'
              THEN JSONB_SET(elem, '{dayTitle}', TO_JSONB(ft.normalized_title), true)
            ELSE elem
          END
          ORDER BY ord
        )
        FROM JSONB_ARRAY_ELEMENTS(pd.cards) WITH ORDINALITY AS e(elem, ord)
      )
      ELSE pd.cards
    END,
    updated_at = NOW()
  FROM final_titles ft
  WHERE pd.id = ft.id
    AND pd.day_title IS DISTINCT FROM ft.normalized_title
  RETURNING pd.id
)
SELECT COUNT(*) AS normalized_rows FROM updated_rows;

COMMIT;
