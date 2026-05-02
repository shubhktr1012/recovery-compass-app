update public.programs
set
  title = '21-Day Deep Sleep Reset',
  updated_at = now()
where slug = 'sleep_disorder_reset'
  and title is distinct from '21-Day Deep Sleep Reset';