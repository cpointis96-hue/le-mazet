import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null; // Déjà géré par le middleware / layout
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return (
            <div className="max-w-3xl mx-auto py-6">
                <p className="text-destructive">Profil introuvable.</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto py-6 px-1">
            <h1 className="text-lg font-bold mb-1">Paramètres</h1>
            <p className="text-xs text-muted-foreground mb-6">Préférences du compte et de l'application</p>

            <ProfileForm
                initialData={{
                    email: user.email ?? '',
                    displayName: profile.display_name,
                    color: profile.color,
                    avatarId: profile.avatar_id
                }}
            />
        </div>
    );
}
