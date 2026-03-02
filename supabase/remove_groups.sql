-- ==============================================================================
-- MISE À JOUR : SUPPRESSION DES GROUPES (Calendrier Global)
-- ==============================================================================
-- L'architecture a été simplifiée. Tous les utilisateurs inscrits font partie du
-- même "Calendrier Commun".
-- Nous supprimons les tables de groupes et simplifions la sécurité RLS.

-- 1. Supprimer les tables inutiles (cascade supprimera les FK dans events)
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.family_groups CASCADE;

-- 2. Redéfinir les RLS pour Events (Global au lieu de par groupe)
-- Il est vital de supprimer d'abord les anciennes politiques POUR EFFACER LA DÉPENDANCE
DROP POLICY IF EXISTS "Voir ses propres événements" ON public.events;
DROP POLICY IF EXISTS "Voir les événements publics du groupe" ON public.events;
DROP POLICY IF EXISTS "Voir les événements privés (masqués) du groupe" ON public.events;
DROP POLICY IF EXISTS "Créer ses propres événements" ON public.events;
DROP POLICY IF EXISTS "Modifier ses propres événements" ON public.events;
DROP POLICY IF EXISTS "Supprimer ses propres événements" ON public.events;

-- 3. Nettoyer la table events (supprimer la colonne group_id)
ALTER TABLE public.events DROP COLUMN IF EXISTS group_id CASCADE;

-- 4. Nettoyer les fonctions Security Definer liées aux groupes
DROP FUNCTION IF EXISTS public.get_user_groups(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_groups(uuid) CASCADE;

-- Lecture de ses propres événements : TOUJOURS AUTORISÉ
CREATE POLICY "Voir ses propres événements"
    ON public.events FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Lecture publique (Le calendrier commun est global pour tous les utilisateurs connectés)
CREATE POLICY "Voir les événements publics de tous"
    ON public.events FOR SELECT
    TO authenticated
    USING (privacy IN ('public', 'public_details'));

-- Lecture privée masquée (L'événement existe sur le calendrier commun mais ses détails sont cachés)
CREATE POLICY "Voir les événements privés (masqués) de tous"
    ON public.events FOR SELECT
    TO authenticated
    USING (privacy = 'prive');

-- Écritures : Strictement limité à soi-même
CREATE POLICY "Créer ses propres événements"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Modifier ses propres événements"
    ON public.events FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Supprimer ses propres événements"
    ON public.events FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
