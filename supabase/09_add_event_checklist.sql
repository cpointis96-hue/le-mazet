-- Création de la table pour la checklist de l'événement ("Qui apporte quoi ?")
CREATE TABLE IF NOT EXISTS public.event_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activation de la sécurité RLS
ALTER TABLE public.event_checklist_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (Confiance de groupe)
-- Lecture : Tous les utilisateurs authentifiés peuvent voir la checklist
CREATE POLICY "Les items de la checklist sont lisibles par tous les utilisateurs connectés"
    ON public.event_checklist_items FOR SELECT
    TO authenticated
    USING (true);

-- Écriture : N'importe quel utilisateur authentifié peut ajouter, s'assigner, ou supprimer (modèle collaboratif)
CREATE POLICY "Tout le monde peut ajouter un item"
    ON public.event_checklist_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Tout le monde peut modifier un item"
    ON public.event_checklist_items FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Tout le monde peut supprimer un item"
    ON public.event_checklist_items FOR DELETE
    TO authenticated
    USING (true);

-- Notifie PostgREST de recharger le schéma
NOTIFY pgrst, 'reload schema';
