-- 1. Ajout de la colonne pour indiquer qu'un événement est multi-dates (mode Doodle)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_multi_date BOOLEAN NOT NULL DEFAULT false;

-- 2. Création de la table pour les propositions de dates
CREATE TABLE IF NOT EXISTS public.event_date_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activation RLS sur les propositions
ALTER TABLE public.event_date_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les propositions sont lisibles par tous"
    ON public.event_date_proposals FOR SELECT
    TO authenticated
    USING (true);

-- Seul le créateur de l'événement peut insérer ou supprimer des options de dates
-- Pour faire simple, tout le monde peut insérer si on est confiant, mais protégeons un peu la création.
CREATE POLICY "Le créateur peut modifier les propositions"
    ON public.event_date_proposals FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid()
        )
    );

-- 3. Création de la table pour le vote sur ces propositions
CREATE TABLE IF NOT EXISTS public.event_date_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.event_date_proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'maybe')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Un seul vote par proposition de date par utilisateur
    UNIQUE(proposal_id, user_id)
);

-- Activation RLS sur les votes
ALTER TABLE public.event_date_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les votes sont lisibles par tous"
    ON public.event_date_votes FOR SELECT
    TO authenticated
    USING (true);

-- N'importe qui peut voter, mais uniquement pour lui-même
CREATE POLICY "Voter pour soi"
    ON public.event_date_votes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Modifier son vote"
    ON public.event_date_votes FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Supprimer son vote"
    ON public.event_date_votes FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Notifie PostgREST
NOTIFY pgrst, 'reload schema';
