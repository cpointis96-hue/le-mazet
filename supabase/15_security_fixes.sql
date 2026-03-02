-- =============================================================================
-- MIGRATION 15 — CORRECTIFS DE SÉCURITÉ
-- À exécuter dans : Supabase > SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BUCKET event-attachments : passer en privé
--    Les fichiers ne seront accessibles que via des URLs signées (2h).
-- -----------------------------------------------------------------------------
UPDATE storage.buckets
    SET public = false
    WHERE id = 'event-attachments';

-- Suppression des anciennes politiques de stockage event-attachments
DROP POLICY IF EXISTS "Fichiers lisibles par tous" ON storage.objects;
DROP POLICY IF EXISTS "Upload de fichiers" ON storage.objects;
DROP POLICY IF EXISTS "Suppression de ses fichiers" ON storage.objects;

-- Nouvelles politiques : lecture authentifiée + propriété sur écriture/suppression
CREATE POLICY "Lecture fichiers événements (authentifié)"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'event-attachments');

CREATE POLICY "Upload fichiers événements"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'event-attachments');

CREATE POLICY "Suppression de ses propres fichiers"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'event-attachments' AND owner = auth.uid());

-- -----------------------------------------------------------------------------
-- 2. BUCKET avatars : corriger les politiques (ajouter authentification requise)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Les avatars sont publics." ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent uploader leur avatar." ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur avatar." ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leur avatar." ON storage.objects;

CREATE POLICY "Avatars visibles par les utilisateurs connectés"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'avatars');

CREATE POLICY "Upload de son propre avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Modification de son propre avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Suppression de son propre avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. ÉVÉNEMENTS PRIVÉS (privacy = 'prive') : supprimer la politique trop permissive
--    qui exposait le titre/description/lieu de tous les événements privés à tous.
--    Remplacé par la fonction RPC get_calendar_events() qui masque ces champs.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Voir les événements privés (masqués) de tous" ON public.events;

-- La politique existante "Voir ses propres événements" (user_id = auth.uid()) couvre
-- le cas où le propriétaire veut voir ses propres événements privés.
-- Les autres utilisateurs voient un slot "occupé" via la fonction RPC ci-dessous.

-- -----------------------------------------------------------------------------
-- 4. FONCTION RPC : get_calendar_events()
--    Retourne tous les événements visibles avec masquage des champs sensibles
--    pour les événements privés des autres utilisateurs.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_calendar_events()
RETURNS TABLE(
    id              UUID,
    user_id         UUID,
    title           TEXT,
    description     TEXT,
    location        TEXT,
    start_date      DATE,
    end_date        DATE,
    start_time      TIME,
    end_time        TIME,
    all_day         BOOLEAN,
    color           TEXT,
    icon            TEXT,
    category        TEXT,
    privacy         TEXT,
    recurrence_rule TEXT,
    recurrence_end  DATE,
    reminder_minutes INTEGER,
    is_multi_date   BOOLEAN,
    status          TEXT,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        e.id,
        e.user_id,
        -- Masque le titre pour les événements privés des autres
        CASE WHEN e.privacy = 'prive' AND e.user_id != auth.uid()
             THEN 'Occupé'::TEXT
             ELSE e.title
        END AS title,
        -- Masque la description
        CASE WHEN e.privacy = 'prive' AND e.user_id != auth.uid()
             THEN NULL::TEXT
             ELSE e.description
        END AS description,
        -- Masque le lieu
        CASE WHEN e.privacy = 'prive' AND e.user_id != auth.uid()
             THEN NULL::TEXT
             ELSE e.location
        END AS location,
        e.start_date,
        e.end_date,
        e.start_time,
        e.end_time,
        e.all_day,
        e.color,
        CASE WHEN e.privacy = 'prive' AND e.user_id != auth.uid()
             THEN NULL::TEXT ELSE e.icon
        END AS icon,
        CASE WHEN e.privacy = 'prive' AND e.user_id != auth.uid()
             THEN NULL::TEXT ELSE e.category
        END AS category,
        e.privacy,
        CASE WHEN e.privacy = 'prive' AND e.user_id != auth.uid()
             THEN NULL::TEXT ELSE e.recurrence_rule
        END AS recurrence_rule,
        CASE WHEN e.privacy = 'prive' AND e.user_id != auth.uid()
             THEN NULL::DATE ELSE e.recurrence_end
        END AS recurrence_end,
        CASE WHEN e.privacy = 'prive' AND e.user_id != auth.uid()
             THEN NULL::INTEGER ELSE e.reminder_minutes
        END AS reminder_minutes,
        e.is_multi_date,
        e.status,
        e.created_at,
        e.updated_at
    FROM public.events e
    WHERE
        e.user_id = auth.uid()                          -- mes propres événements
        OR e.privacy IN ('public', 'public_details')    -- événements publics de tous
        OR e.privacy = 'prive'                          -- slots "occupé" (champs masqués ci-dessus)
    ORDER BY e.start_date;
$$;

GRANT EXECUTE ON FUNCTION public.get_calendar_events() TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. POLITIQUE event_date_proposals : ajouter WITH CHECK explicite
--    (amélioration de clarté — comportement identique, intention documentée)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Le créateur peut modifier les propositions" ON public.event_date_proposals;

CREATE POLICY "Le créateur peut gérer ses propositions"
    ON public.event_date_proposals FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_id AND e.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_id AND e.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 6. TABLE profiles : ajouter politique INSERT manquante
--    (le trigger handle_new_user crée le profil, mais en cas de besoin direct)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Insérer son propre profil" ON public.profiles;
CREATE POLICY "Insérer son propre profil"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Notifie PostgREST de recharger le schéma
NOTIFY pgrst, 'reload schema';
