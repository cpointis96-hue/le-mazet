-- =============================================================
-- CALENSHARE — Schéma Supabase
-- À exécuter dans : Supabase > SQL Editor
-- =============================================================

-- ---------------------------------------------------------------
-- 1. TABLE : profiles
-- Extension de auth.users (1 profil par utilisateur)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Utilisateur',
    color        TEXT NOT NULL DEFAULT '#6366f1',
    avatar_id    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, color)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data ->> 'color', '#6366f1')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------
-- 2. TABLE : family_groups
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 3. TABLE : family_members
-- Jonction entre utilisateurs et groupes familiaux
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

-- ---------------------------------------------------------------
-- 4. TABLE : events
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id         UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
    title            TEXT NOT NULL,
    description      TEXT,
    location         TEXT,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    start_time       TIME,
    end_time         TIME,
    all_day          BOOLEAN NOT NULL DEFAULT FALSE,
    color            TEXT NOT NULL DEFAULT '#6366f1',
    icon             TEXT,
    category         TEXT,
    privacy          TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('prive', 'public', 'public_details')),
    recurrence_rule  TEXT,
    recurrence_end   DATE,
    reminder_minutes INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index utile pour les requêtes calendrier
CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);
CREATE INDEX IF NOT EXISTS events_date_range_idx ON public.events(start_date, end_date);
CREATE INDEX IF NOT EXISTS events_group_id_idx ON public.events(group_id);

-- ---------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profil visible par tous les membres connectés"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Modifier uniquement son propre profil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- FAMILY GROUPS
CREATE POLICY "Voir les groupes dont on est membre"
    ON public.family_groups FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Créer un groupe"
    ON public.family_groups FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admin peut modifier le groupe"
    ON public.family_groups FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT group_id FROM public.family_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- FAMILY MEMBERS
CREATE POLICY "Voir les membres de son groupe"
    ON public.family_members FOR SELECT
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admin peut gérer les membres"
    ON public.family_members FOR ALL
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id FROM public.family_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- EVENTS
CREATE POLICY "Voir ses propres événements"
    ON public.events FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Voir les événements publics du groupe"
    ON public.events FOR SELECT
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
        )
        AND privacy IN ('public', 'public_details')
    );

CREATE POLICY "Voir les événements privés (masqués) du groupe"
    ON public.events FOR SELECT
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
        )
        AND privacy = 'prive'
    );

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
