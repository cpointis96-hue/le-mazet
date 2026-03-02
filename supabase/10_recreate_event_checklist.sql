-- Suppression de l'ancienne table si elle existe (pour repartir au propre avec le nouveau design)
DROP TABLE IF EXISTS public.event_checklist_items;

-- Création de la nouvelle table pour la checklist ("Ce que je ramène")
CREATE TABLE public.event_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('vin_rouge', 'vin_blanc', 'dessert', 'saucisson', 'charcuterie', 'fromage', 'autres')),
    description TEXT, -- Pour la quantité ou les détails optionnels ("2 bouteilles", "Tarte aux pommes")
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activation de la sécurité RLS
ALTER TABLE public.event_checklist_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (Confiance de groupe, mais chacun gère ses propres items)

-- 1. Lecture : Tous les utilisateurs authentifiés peuvent voir la checklist
CREATE POLICY "Les items de la checklist sont lisibles par tous"
    ON public.event_checklist_items FOR SELECT
    TO authenticated
    USING (true);

-- 2. Création : On ne peut ajouter des trucs qu'en son propre nom
CREATE POLICY "Créer ses propres items"
    ON public.event_checklist_items FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 3. Modification : On ne modifie que ce qu'on a soi-même ajouté
CREATE POLICY "Modifier ses propres items"
    ON public.event_checklist_items FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. Suppression : On ne supprime que ses propres items
CREATE POLICY "Supprimer ses propres items"
    ON public.event_checklist_items FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- On notifie PostgREST de recharger le schéma
NOTIFY pgrst, 'reload schema';
