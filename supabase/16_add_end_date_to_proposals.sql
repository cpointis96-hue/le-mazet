-- =============================================================================
-- MIGRATION 16 — Ajout de end_date dans event_date_proposals
--   Permet les propositions de type "vacances" avec une plage de dates (début → fin).
-- =============================================================================

ALTER TABLE public.event_date_proposals ADD COLUMN IF NOT EXISTS end_date DATE;

-- Notifie PostgREST de recharger le schéma
NOTIFY pgrst, 'reload schema';
