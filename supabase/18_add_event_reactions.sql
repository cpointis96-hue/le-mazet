-- Migration: Create event_reactions table for quick emoji responses

CREATE TABLE public.event_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (char_length(emoji) > 0 AND char_length(emoji) <= 10),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, user_id, emoji) -- L'utilisateur ne peut mettre qu'une fois le même émoji par événement
);

-- Index pour optimiser la récupération des réactions par événement
CREATE INDEX idx_event_reactions_event_id ON public.event_reactions(event_id);

-- RLS (Row Level Security)
ALTER TABLE public.event_reactions ENABLE ROW LEVEL SECURITY;

-- Politique : Tout utilisateur connecté peut voir toutes les réactions
CREATE POLICY "Les utilisateurs authentifiés peuvent voir toutes les réactions"
ON public.event_reactions FOR SELECT
TO authenticated
USING (true);

-- Politique : Un utilisateur peut ajouter sa propre réaction
CREATE POLICY "Un utilisateur peut ajouter sa propre réaction"
ON public.event_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Politique : Un utilisateur peut supprimer sa propre réaction
CREATE POLICY "Un utilisateur peut supprimer sa propre réaction"
ON public.event_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Exposer la table à Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_reactions;
