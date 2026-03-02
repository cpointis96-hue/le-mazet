-- Création de la table `event_attachments` (Pièces jointes)
CREATE TABLE IF NOT EXISTS public.event_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pièces jointes lisibles par tous" ON public.event_attachments;
DROP POLICY IF EXISTS "Upload par utilisateur authentifié" ON public.event_attachments;
DROP POLICY IF EXISTS "Suppression par l'auteur" ON public.event_attachments;

CREATE POLICY "Pièces jointes lisibles par tous" ON public.event_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Upload par utilisateur authentifié" ON public.event_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Suppression par l'auteur" ON public.event_attachments FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- Action requise pour forcer Supabase à recharger le cache:
NOTIFY pgrst, 'reload schema';
