BEGIN;

WITH rewritten AS (
  SELECT
    pt.program_slug,
    jsonb_agg(
      CASE
        WHEN slot->>'slot_id' = 'morning_sunlight'
          THEN jsonb_set(slot, '{card_template,stepNumber}', '3'::jsonb, false)
        ELSE slot
      END
      ORDER BY ord
    ) AS template_slots
  FROM public.program_templates AS pt
  CROSS JOIN LATERAL jsonb_array_elements(pt.template_slots) WITH ORDINALITY AS elems(slot, ord)
  WHERE pt.program_slug = 'energy_vitality'
  GROUP BY pt.program_slug
)
UPDATE public.program_templates AS pt
SET template_slots = rewritten.template_slots,
    updated_at = NOW()
FROM rewritten
WHERE pt.program_slug = rewritten.program_slug;

COMMIT;
