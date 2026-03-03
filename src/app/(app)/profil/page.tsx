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
        <div className="max-w-2xl mx-auto py-8 pl-10 lg:pl-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mon Profil</h1>
            <p className="text-muted-foreground mb-8">
                Gérez vos informations personnelles et votre apparence sur le calendrier.
            </p>

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
