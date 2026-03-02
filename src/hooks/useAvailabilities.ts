'use client';

import { useState, useCallback, useEffect } from 'react';
import { UserAvailability, AvailabilityStatus } from '@/types/calendar.types';
import { createClient } from '@/lib/supabase/client';
import {
    getAvailabilities,
    upsertAvailability,
    deleteAvailability,
} from '@/lib/supabase/availability-queries';

export function useAvailabilities() {
    const [availabilities, setAvailabilities] = useState<UserAvailability[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoaded(true);
                return;
            }
            setCurrentUserId(user.id);
            const data = await getAvailabilities(supabase);
            setAvailabilities(data);
            setIsLoaded(true);
        }

        init();

        // Realtime : écoute les changements sur la table user_availability
        const channel = supabase
            .channel('availability-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_availability' },
                async () => {
                    const fresh = await getAvailabilities(supabase);
                    setAvailabilities(fresh);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const toggleAvailability = useCallback(
        async (date: string, currentStatus?: AvailabilityStatus) => {
            if (!currentUserId) return;
            const supabaseForWrite = createClient();

            // Logique de toggle : Vide -> available -> busy -> Vide
            if (!currentStatus) {
                // Créer 'available'
                const updated = await upsertAvailability(supabaseForWrite, currentUserId, date, 'available');
                if (updated) {
                    setAvailabilities((prev) => [...prev.filter(a => !(a.userId === currentUserId && a.date === date)), updated]);
                }
            } else if (currentStatus === 'available') {
                // Passer à 'busy'
                const updated = await upsertAvailability(supabaseForWrite, currentUserId, date, 'busy');
                if (updated) {
                    setAvailabilities((prev) => [...prev.filter(a => !(a.userId === currentUserId && a.date === date)), updated]);
                }
            } else if (currentStatus === 'busy') {
                // Supprimer
                const ok = await deleteAvailability(supabaseForWrite, currentUserId, date);
                if (ok) {
                    setAvailabilities((prev) => prev.filter(a => !(a.userId === currentUserId && a.date === date)));
                }
            }
        },
        [currentUserId]
    );

    return {
        availabilities,
        toggleAvailability,
        isLoaded,
        currentUserId,
    };
}
