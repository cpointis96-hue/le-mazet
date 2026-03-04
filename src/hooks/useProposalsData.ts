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
import { getAllEventDateProposals, getAllEventDateVotes } from '@/lib/supabase/queries';
import { EventDateProposal, EventDateVote } from '@/types/calendar.types';

export function useProposalsData() {
    const [responses, setResponses] = useState<EventResponse[]>([]);
    const [comments, setComments] = useState<EventComment[]>([]);
    const [dateProposals, setDateProposals] = useState<EventDateProposal[]>([]);
    const [dateVotes, setDateVotes] = useState<(EventDateVote & { user: { displayName: string, avatarId: string | null } })[]>([]);
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
            const dProps = await getAllEventDateProposals(supabase);
            const dVotes = await getAllEventDateVotes(supabase);

            setResponses(res);
            setComments(com);
            setDateProposals(dProps);
            setDateVotes(dVotes);
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

        const channelDateProps = supabase
            .channel('date-proposals-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_date_proposals' }, async () => {
                const fresh = await getAllEventDateProposals(supabase);
                setDateProposals(fresh);
            })
            .subscribe();

        const channelDateVotes = supabase
            .channel('date-votes-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_date_votes' }, async () => {
                const fresh = await getAllEventDateVotes(supabase);
                setDateVotes(fresh);
            })
            .subscribe();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                init();
            } else if (event === 'SIGNED_OUT') {
                setResponses([]);
                setComments([]);
                setDateProposals([]);
                setDateVotes([]);
                setCurrentUserId(null);
            }
        });

        return () => {
            supabase.removeChannel(channelResp);
            supabase.removeChannel(channelComm);
            supabase.removeChannel(channelDateProps);
            supabase.removeChannel(channelDateVotes);
            subscription.unsubscribe();
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

    const updateDateVoteLocal = useCallback((proposalId: string, userId: string, status: 'available' | 'unavailable' | 'maybe', userDisplay: { displayName: string, avatarId: string | null }) => {
        setDateVotes(prev => {
            const existing = prev.find(v => v.proposalId === proposalId && v.userId === userId);
            if (existing && existing.status === status) {
                return prev.filter(v => !(v.proposalId === proposalId && v.userId === userId));
            } else if (existing) {
                return prev.map(v => v.proposalId === proposalId && v.userId === userId ? { ...v, status } : v);
            } else {
                return [...prev, {
                    id: `temp-${Date.now()}`,
                    proposalId,
                    userId,
                    status,
                    user: userDisplay
                } as any];
            }
        });
    }, []);

    return {
        responses,
        comments,
        dateProposals,
        dateVotes,
        setResponse,
        postComment,
        updateDateVoteLocal,
        currentUserId
    };
}
