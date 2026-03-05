import { AppShell } from '@/components/layout/AppShell';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/connexion');
    }

    return (
        <AppDataProvider>
            <AppShell>{children}</AppShell>
        </AppDataProvider>
    );
}
