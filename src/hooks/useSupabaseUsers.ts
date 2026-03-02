'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
    id: string;
    displayName: string;
    color: string;
    avatarId?: string;
    isCurrentUser?: boolean;
}

export function useSupabaseUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        async function fetchUsers() {
            // Récupérer d'abord l'utilisateur courant pour l'identifier
            const { data: { user } } = await supabase.auth.getUser();

            // Récupérer TOUS les profils (appli intimiste ~15 personnes)
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('display_name');

            if (profiles && !error) {
                const mappedUsers: UserProfile[] = profiles.map(profile => ({
                    id: profile.id,
                    displayName: profile.display_name,
                    color: profile.color,
                    avatarId: profile.avatar_id,
                    isCurrentUser: user ? profile.id === user.id : false,
                }));

                setUsers(mappedUsers);

                if (user) {
                    const current = mappedUsers.find(u => u.isCurrentUser);
                    if (current) setCurrentUser(current);
                }
            }

            setIsLoaded(true);
        }

        fetchUsers();
    }, []);

    // Stubs vides pour compatibilité avec l'ancien hook localStorage (pour l'instant)
    const addUser = () => ({ id: '', displayName: '', color: '' });
    const loginAs = () => { };

    return {
        users,
        currentUser,
        addUser,
        loginAs,
        isLoaded
    };
}
