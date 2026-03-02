-- Table des disponibilités (Vert/Rouge)
CREATE TABLE IF NOT EXISTS public.user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('available', 'busy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Active le Row Level Security
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;

-- Les disponibilités sont publiques en lecture (pour le calendrier commun)
CREATE POLICY "Les disponibilités sont lisibles par tous les utilisateurs connectés"
    ON public.user_availability
    FOR SELECT
    TO authenticated
    USING (true);

-- Insertion automatique (Upsert) autorisée seulement pour ses propres disponibilités
CREATE POLICY "Les utilisateurs peuvent insérer leurs propres disponibilités"
    ON public.user_availability
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Mise à jour autorisée seulement pour ses propres disponibilités
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres disponibilités"
    ON public.user_availability
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Suppression autorisée seulement pour ses propres disponibilités
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres disponibilités"
    ON public.user_availability
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_availability
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
