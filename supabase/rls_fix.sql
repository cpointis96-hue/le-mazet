-- ==============================================================================
-- CORRECTION DÉFINITIVE DES POLITIQUES RLS (Erreur 42P17 - Boucle infinie)
-- ==============================================================================
-- Le problème venait du fait que PostgreSQL évalue les politiques RLS à chaque SELECT.
-- Si la table family_members est lue POUR valider l'accès à la table family_members, 
-- ça boucle. La solution propre est d'utiliser une fonction "security definer".

-- 1. On supprime TOUTES les anciennes politiques qui causent la boucle
DROP POLICY IF EXISTS "Voir les groupes dont on est membre" ON public.family_groups;
DROP POLICY IF EXISTS "Admin peut modifier le groupe" ON public.family_groups;

DROP POLICY IF EXISTS "Voir les membres de son groupe" ON public.family_members;
DROP POLICY IF EXISTS "Admin peut gerer les membres" ON public.family_members;
DROP POLICY IF EXISTS "Voir ses propres adhésions" ON public.family_members;
DROP POLICY IF EXISTS "Voir les adhésions des autres membres du groupe" ON public.family_members;
DROP POLICY IF EXISTS "Gérer ses propres groupes en tant qu'admin" ON public.family_members;
DROP POLICY IF EXISTS "Admin peut gérer les membres" ON public.family_members;

DROP POLICY IF EXISTS "Voir les événements publics du groupe" ON public.events;
DROP POLICY IF EXISTS "Voir les événements privés (masqués) du groupe" ON public.events;

-- 2. On crée une fonction SECURITY DEFINER (elle contourne la vérification RLS 
--    en s'exécutant avec les droits du créateur de la fonction).
CREATE OR REPLACE FUNCTION public.get_user_groups(user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT group_id 
    FROM family_members 
    WHERE family_members.user_id = $1;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_groups(user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT group_id 
    FROM family_members 
    WHERE family_members.user_id = $1 AND role = 'admin';
$$;

-- 3. On recrée les politiques en utilisant ces fonctions sécurisées.

-- ==========================================
-- FAMILY GROUPS
-- ==========================================
CREATE POLICY "Voir les groupes dont on est membre"
    ON public.family_groups FOR SELECT
    TO authenticated
    USING (id IN (SELECT public.get_user_groups(auth.uid())));

CREATE POLICY "Admin peut modifier le groupe"
    ON public.family_groups FOR UPDATE
    TO authenticated
    USING (id IN (SELECT public.get_admin_groups(auth.uid())));

-- ==========================================
-- FAMILY MEMBERS
-- ==========================================
CREATE POLICY "Voir les membres de son groupe"
    ON public.family_members FOR SELECT
    TO authenticated
    USING (group_id IN (SELECT public.get_user_groups(auth.uid())));

CREATE POLICY "Admin peut gérer les membres"
    ON public.family_members FOR ALL
    TO authenticated
    USING (group_id IN (SELECT public.get_admin_groups(auth.uid())));

-- ==========================================
-- EVENTS
-- ==========================================
CREATE POLICY "Voir les événements publics du groupe"
    ON public.events FOR SELECT
    TO authenticated
    USING (
        group_id IN (SELECT public.get_user_groups(auth.uid()))
        AND privacy IN ('public', 'public_details')
    );

CREATE POLICY "Voir les événements privés (masqués) du groupe"
    ON public.events FOR SELECT
    TO authenticated
    USING (
        group_id IN (SELECT public.get_user_groups(auth.uid()))
        AND privacy = 'prive'
    );
