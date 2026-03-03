-- =============================================================================
-- MIGRATION 17 — Ajout de poll_deadline dans events
--   Permet de définir une date de fin de sondage pour les événements MultiDate.
-- =============================================================================

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS poll_deadline DATE;

-- Notifie PostgREST de recharger le schéma
NOTIFY pgrst, 'reload schema';
