'use client';

import { useState, useCallback, useEffect } from 'react';
import { CalendarEvent, SharedEventDisplay } from '@/types/calendar.types';
import { createClient } from '@/lib/supabase/client';
import {
    getEvents,
    createEvent,
    updateEvent as updateEventQuery,
    deleteEvent as deleteEventQuery,
    createDateProposals,
    deleteEventDateProposals
} from '@/lib/supabase/queries';
import { uploadEventAttachments } from '@/lib/supabase/attachments';

export function useSupabaseEvents(eventResponses?: { eventId: string, userId: string, status: string }[]) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
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
            const data = await getEvents(supabase); // RLS filtres les events inaccessibles
            setEvents(data);
            setIsLoaded(true);
        }

        init();

        // Realtime : écoute les changements sur la table events globalement
        const channel = supabase
            .channel('events-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'events' },
                async () => {
                    const fresh = await getEvents(supabase);
                    setEvents(fresh);
                }
            )
            .subscribe();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                init();
            } else if (event === 'SIGNED_OUT') {
                setEvents([]);
                setCurrentUserId(null);
            }
        });

        return () => {
            supabase.removeChannel(channel);
            subscription.unsubscribe();
        };
    }, []);

    const personalEvents = events.filter((e) => {
        if (!currentUserId) return false;

        let hasVotedUnavailable = false;
        let hasVotedAvailable = false;

        if (eventResponses) {
            hasVotedUnavailable = eventResponses.some(r => r.eventId === e.id && r.userId === currentUserId && r.status === 'unavailable');
            hasVotedAvailable = eventResponses.some(r => r.eventId === e.id && r.userId === currentUserId && r.status === 'available');
        }

        // Si j'ai voté 'pas disponible', on cache toujours l'événement
        if (hasVotedUnavailable) return false;

        // Sinon, on l'affiche si je l'ai créé OU si j'ai explicitement dit que j'étais 'disponible'
        return e.userId === currentUserId || hasVotedAvailable;
    });

    const sharedEvents: SharedEventDisplay[] = events.filter(e => {
        // Un événement proposé n'apparaît dans le calendrier commun que s'il a au moins 2 personnes disponibles
        if (e.status === 'proposed') {
            if (eventResponses) {
                const availableCount = eventResponses.filter(r => r.eventId === e.id && r.status === 'available').length;
                if (availableCount < 2) return false;
            } else {
                return false;
            }
        }
        return true;
    }).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.startDate,
        endDate: e.endDate,
        color: e.color,
        userId: e.userId,
        status: e.status,
    }));

    const addEvent = useCallback(
        async (event: Omit<CalendarEvent, 'id' | 'userId'> & { proposals?: any[] }, files?: File[]) => {
            if (!currentUserId) return;
            const supabaseForWrite = createClient();

            // Extract proposals so they don't break createEvent typing if it strictly expects CalendarEvent fields
            const { proposals, ...eventData } = event;

            const created = await createEvent(supabaseForWrite, eventData as Omit<CalendarEvent, 'id' | 'userId'>, currentUserId);
            if (created) {
                // On enregistre les propositions si elles existent (sondage ou vacances multi-périodes)
                if (proposals && proposals.length > 0) {
                    await createDateProposals(supabaseForWrite, created.id, proposals);
                }
                if (files && files.length > 0) {
                    await uploadEventAttachments(supabaseForWrite, created.id, files, currentUserId);
                }
                setEvents((prev) => [...prev, created]);
            }
        },
        [currentUserId]
    );

    const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent & { proposals?: any[] }>, files?: File[]) => {
        const supabaseForWrite = createClient();
        const { proposals, ...eventUpdates } = updates;

        const updated = await updateEventQuery(supabaseForWrite, id, eventUpdates as Partial<CalendarEvent>);
        if (updated) {
            if (proposals) {
                await deleteEventDateProposals(supabaseForWrite, id);
                if (proposals.length > 0) {
                    await createDateProposals(supabaseForWrite, id, proposals);
                }
            }
            if (files && files.length > 0 && currentUserId) {
                await uploadEventAttachments(supabaseForWrite, id, files, currentUserId);
            }
            setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
        }
    }, [currentUserId]);

    const deleteEvent = useCallback(async (id: string) => {
        const supabaseForWrite = createClient();
        const ok = await deleteEventQuery(supabaseForWrite, id);
        if (ok) {
            setEvents((prev) => prev.filter((e) => e.id !== id));
        }
    }, []);

    return {
        events,
        personalEvents,
        sharedEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        isLoaded,
        currentUserId,
    };
}
