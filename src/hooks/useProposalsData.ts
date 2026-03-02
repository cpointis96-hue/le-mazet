'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    getEventResponses,
    upsertEventResponse,
    deleteEventResponse,
    getEventComments,
    addEventComment,
    EventResponse,
    EventComment
} from '@/lib/supabase/proposals-queries';

export function useProposalsData() {
    const [responses, setResponses] = useState<EventResponse[]>([]);
    const [comments, setComments] = useState<EventComment[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
            const res = await getEventResponses(supabase);
            const com = await getEventComments(supabase);

            setResponses(res);
            setComments(com);
        }

        init();

        const channelResp = supabase
            .channel('responses-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_responses' }, async () => {
                const fresh = await getEventResponses(supabase);
                setResponses(fresh);
            })
            .subscribe();

        const channelComm = supabase
            .channel('comments-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_comments' }, async () => {
                const fresh = await getEventComments(supabase);
                setComments(fresh);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelResp);
            supabase.removeChannel(channelComm);
        };
    }, []);

    const setResponse = useCallback(async (eventId: string, desiredStatus: 'available' | 'unavailable', currentStatus?: 'available' | 'unavailable') => {
        if (!currentUserId) return;

        // Mise à jour optimiste (réaction instantanée UI)
        setResponses(prev => {
            const others = prev.filter(r => !(r.eventId === eventId && r.userId === currentUserId));
            if (currentStatus === desiredStatus) {
                // Remove vote
                return others;
            } else {
                // Add or update vote
                return [...others, {
                    id: `temp-${eventId}-${Date.now()}`,
                    eventId,
                    userId: currentUserId,
                    status: desiredStatus,
                    createdAt: new Date().toISOString()
                }];
            }
        });

        const supabase = createClient();

        if (currentStatus === desiredStatus) {
            // Clicked the same status again -> Remove vote
            await deleteEventResponse(supabase, eventId, currentUserId);
        } else {
            // Clicked a status (new or different) -> Upsert vote
            await upsertEventResponse(supabase, eventId, currentUserId, desiredStatus);
        }
    }, [currentUserId]);

    const postComment = useCallback(async (eventId: string, content: string) => {
        if (!currentUserId || !content.trim()) return;
        const supabase = createClient();
        await addEventComment(supabase, eventId, currentUserId, content.trim());
    }, [currentUserId]);

    return {
        responses,
        comments,
        setResponse,
        postComment,
        currentUserId
    };
}
