-- Activer le Realtime pour les nouvelles tables
-- Supabase ne diffuse les changements que pour les tables explicitement ajoutées à la publication "supabase_realtime"

begin;
  -- On vérifie s'il existe une publication supabase_realtime et on ajoute les tables
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- On ajoute les tables au flux Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_date_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_date_votes;

-- Notifie PostgREST
NOTIFY pgrst, 'reload schema';
