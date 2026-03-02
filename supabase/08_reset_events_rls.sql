-- Efface TOUTES les politiques events existantes (peu importe leur nom)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname 
             FROM pg_policies 
             WHERE tablename = 'events' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', pol.policyname);
  END LOOP;
END $$;

-- Recrée tout proprement
CREATE POLICY "select_own" ON public.events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "select_public" ON public.events FOR SELECT TO authenticated USING (privacy IN ('public', 'public_details'));
CREATE POLICY "insert_own" ON public.events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON public.events FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON public.events FOR DELETE TO authenticated USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
