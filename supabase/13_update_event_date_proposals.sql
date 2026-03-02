-- Migration script to adapt event date proposals
-- Rename date to start_date
ALTER TABLE public.event_date_proposals RENAME COLUMN date TO start_date;

-- Add end_date and comment
ALTER TABLE public.event_date_proposals ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.event_date_proposals ADD COLUMN IF NOT EXISTS comment TEXT;

-- Supprimer les colonnes d'heures devenues inutiles
ALTER TABLE public.event_date_proposals DROP COLUMN IF EXISTS start_time;
ALTER TABLE public.event_date_proposals DROP COLUMN IF EXISTS end_time;

-- Update existing rows: make end_date equal to start_date
UPDATE public.event_date_proposals SET end_date = start_date WHERE end_date IS NULL;

-- Now make end_date NOT NULL
ALTER TABLE public.event_date_proposals ALTER COLUMN end_date SET NOT NULL;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
