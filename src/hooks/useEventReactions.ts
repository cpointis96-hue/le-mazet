'use client';

import { useState, useEffect, useCallback } from 'react';
import { EventReaction } from '@/types/calendar.types';
import { createClient } from '@/lib/supabase/client';
import { getEventReactions, addEventReaction, deleteEventReaction } from '@/lib/supabase/queries';

export function useEventReactions(eventId: string) {
    const [reactions, setReactions] = useState<EventReaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReactions = useCallback(async () => {
        setIsLoading(true);
        const supabase = createClient();
        const data = await getEventReactions(supabase, eventId);
        setReactions(data);
        setIsLoading(false);
    }, [eventId]);

    useEffect(() => {
        fetchReactions();

        const supabase = createClient();
        const channel = supabase
            .channel(`reactions_for_event_${eventId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'event_reactions', filter: `event_id=eq.${eventId}` },
                () => {
                    fetchReactions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, fetchReactions]);

    const addReaction = async (userId: string, emoji: string) => {
        const supabase = createClient();
        // Optimistic update
        const tempReaction: EventReaction = {
            id: 'temp-' + Date.now(),
            eventId,
            userId,
            emoji,
            createdAt: new Date().toISOString()
        };
        setReactions(prev => [...prev, tempReaction]);

        const success = await addEventReaction(supabase, eventId, userId, emoji);
        if (!success) {
            // Revert on failure
            fetchReactions();
        }
    };

    const removeReaction = async (userId: string, emoji: string) => {
        const supabase = createClient();
        // Optimistic update
        setReactions(prev => prev.filter(r => !(r.userId === userId && r.emoji === emoji)));

        const success = await deleteEventReaction(supabase, eventId, userId, emoji);
        if (!success) {
            // Revert on failure
            fetchReactions();
        }
    };

    const toggleReaction = async (userId: string, emoji: string) => {
        if (!userId) return;
        const hasReacted = reactions.some(r => r.userId === userId && r.emoji === emoji);
        if (hasReacted) {
            await removeReaction(userId, emoji);
        } else {
            await addReaction(userId, emoji);
        }
    };

    return {
        reactions,
        isLoading,
        toggleReaction,
        addReaction,
        removeReaction,
    };
}
