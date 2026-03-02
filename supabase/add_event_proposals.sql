-- 1. Ajout de la colonne `status` à la table `events`
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('proposed', 'confirmed'));

-- 2. Création de la table `event_responses` (Réponses/Votes aux propositions)
CREATE TABLE IF NOT EXISTS public.event_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('available', 'unavailable')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les réponses sont lisibles par tous les utilisateurs connectés" ON public.event_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Les utilisateurs peuvent insérer leur propre réponse" ON public.event_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent modifier leur propre réponse" ON public.event_responses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent supprimer leur propre réponse" ON public.event_responses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER handle_event_responses_updated_at BEFORE UPDATE ON public.event_responses FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- 3. Création de la table `event_comments` (Espace de discussion pour les propositions)
CREATE TABLE IF NOT EXISTS public.event_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les commentaires sont lisibles par tous les utilisateurs connectés" ON public.event_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Les utilisateurs peuvent écrire un commentaire" ON public.event_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent modifier leur propre commentaire" ON public.event_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent supprimer leur propre commentaire" ON public.event_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Création de la table `event_attachments` (Pièces jointes)
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
CREATE POLICY "Pièces jointes lisibles par tous" ON public.event_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Upload par utilisateur authentifié" ON public.event_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Suppression par l'auteur" ON public.event_attachments FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- 5. Création du Storage Bucket pour les fichiers
INSERT INTO storage.buckets (id, name, public) VALUES ('event-attachments', 'event-attachments', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Fichiers lisibles par tous" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'event-attachments');
CREATE POLICY "Upload de fichiers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-attachments');
CREATE POLICY "Suppression de ses fichiers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-attachments' AND auth.uid() = owner);
