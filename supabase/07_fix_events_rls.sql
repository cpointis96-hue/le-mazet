-- Autoriser l'utilisateur à créer, modifier et supprimer ses propres événements
DROP POLICY IF EXISTS "Modifier ses propres événements" ON public.events;
DROP POLICY IF EXISTS "Supprimer ses propres événements" ON public.events;
DROP POLICY IF EXISTS "Créer un événement" ON public.events;

CREATE POLICY "Créer un événement"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Modifier ses propres événements"
    ON public.events FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Supprimer ses propres événements"
    ON public.events FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
