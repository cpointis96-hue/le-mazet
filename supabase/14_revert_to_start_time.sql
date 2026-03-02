-- Rétablir la colonne start_time
ALTER TABLE public.event_date_proposals ADD COLUMN IF NOT EXISTS start_time TIME;

-- Supprimer la colonne end_date (devenue inutile)
ALTER TABLE public.event_date_proposals DROP COLUMN IF EXISTS end_date;

-- Notifier PostgREST
NOTIFY pgrst, 'reload schema';
