"use client";

import { useState, useEffect } from "react";
import { EventDateProposal, EventDateVote } from "@/types/calendar.types";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";
import { createClient } from "@/lib/supabase/client";
import { getEventDateProposals, getEventDateVotes, voteForDateProposal, confirmWinningDate, deleteDateVote } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Check, X, HelpCircle, Trophy } from "lucide-react";

export function EventDateProposals({ eventId, creatorId, onConfirmed }: { eventId: string, creatorId: string, onConfirmed: () => void }) {
    const { currentUser } = useSupabaseUsers();
    const supabase = createClient();

    const [proposals, setProposals] = useState<EventDateProposal[]>([]);
    const [votes, setVotes] = useState<(EventDateVote & { user: { displayName: string, avatarId: string | null } })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState<string | null>(null);

    const isCreator = currentUser?.id === creatorId;

    useEffect(() => {
        const fetchProposalsAndVotes = async (showLoading = false) => {
            if (showLoading) setIsLoading(true);
            const [pData, vData] = await Promise.all([
                getEventDateProposals(supabase, eventId),
                getEventDateVotes(supabase, eventId)
            ]);
            setProposals(pData);
            setVotes(vData);
            if (showLoading) setIsLoading(false);
        };
        fetchProposalsAndVotes(true);

        const channel = supabase.channel(`votes_${eventId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'event_date_votes' },
                () => fetchProposalsAndVotes()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, supabase]);

    const handleVote = async (proposalId: string, status: 'available' | 'unavailable' | 'maybe') => {
        if (!currentUser) return;

        let needsDelete = false;

        // Optimistic update
        setVotes(prev => {
            const existing = prev.find(v => v.proposalId === proposalId && v.userId === currentUser.id);
            if (existing && existing.status === status) {
                // Toggle off
                needsDelete = true;
                return prev.filter(v => !(v.proposalId === proposalId && v.userId === currentUser.id));
            } else if (existing) {
                // Change vote
                return prev.map(v => v.proposalId === proposalId && v.userId === currentUser.id ? { ...v, status } : v);
            } else {
                // New vote
                return [...prev, {
                    id: `temp-${Date.now()}`,
                    proposalId,
                    userId: currentUser.id,
                    status,
                    user: { displayName: currentUser.displayName, avatarId: currentUser.avatarId ?? null }
                }];
            }
        });

        if (needsDelete) {
            await deleteDateVote(supabase, proposalId, currentUser.id);
        } else {
            await voteForDateProposal(supabase, proposalId, currentUser.id, status);
        }
        // Supabase Realtime will automatically update the list behind the scenes
    };

    const handleConfirm = async (proposalId: string) => {
        setIsConfirming(proposalId);
        const ok = await confirmWinningDate(supabase, eventId, proposalId);
        setIsConfirming(null);
        if (ok) {
            onConfirmed();
        }
    };

    if (isLoading) return <div className="text-sm text-muted-foreground animate-pulse">Chargement des propositions...</div>;

    if (proposals.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                {proposals.map(proposal => {
                    const proposalVotes = votes.filter(v => v.proposalId === proposal.id);
                    const myVote = proposalVotes.find(v => v.userId === currentUser?.id)?.status;

                    const startDate = new Date(proposal.startDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
                    let dateDisplay: string;
                    if (proposal.endDate) {
                        const endDate = new Date(proposal.endDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
                        dateDisplay = `${startDate} → ${endDate}`;
                    } else {
                        const timeStr = proposal.startTime ? proposal.startTime.slice(0, 5) : 'Toute la journée';
                        dateDisplay = `${startDate} — ${timeStr}`;
                    }

                    // Sort votes: available first, then maybe, then unavailable
                    const sortedVotes = [...proposalVotes].sort((a, b) => {
                        const score = { available: 2, maybe: 1, unavailable: 0 };
                        return score[b.status] - score[a.status];
                    });

                    const availableCount = proposalVotes.filter(v => v.status === 'available').length;

                    return (
                        <div key={proposal.id} className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold capitalize text-foreground/90">
                                        {dateDisplay}
                                    </div>
                                    {proposal.comment && (
                                        <div className="text-sm text-muted-foreground mt-1 italic">"{proposal.comment}"</div>
                                    )}
                                </div>
                                {isCreator && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 border-green-500/30 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30 font-semibold"
                                        onClick={() => handleConfirm(proposal.id)}
                                        disabled={isConfirming === proposal.id}
                                    >
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        {isConfirming === proposal.id ? '...' : 'Choisir'}
                                    </Button>
                                )}
                            </div>

                            {/* Voters display */}
                            {sortedVotes.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {sortedVotes.map(v => (
                                        <div key={v.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium shadow-sm ${v.status === 'available' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-300' :
                                            v.status === 'unavailable' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300' :
                                                'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300'
                                            }`}>
                                            <UserAvatar user={{ displayName: v.user.displayName, color: '#999' }} className="w-5 h-5 text-[10px]" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* My voting actions */}
                            <div className="flex gap-2 pt-3 border-t mt-2">
                                <Button
                                    size="sm"
                                    variant={myVote === 'available' ? 'default' : 'outline'}
                                    className={`flex-1 shadow-sm ${myVote === 'available' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                    onClick={() => handleVote(proposal.id, 'available')}
                                >
                                    <Check className="w-4 h-4 mr-1.5" /> Dispo {availableCount > 0 && `(${availableCount})`}
                                </Button>
                                <Button
                                    size="sm"
                                    variant={myVote === 'maybe' ? 'default' : 'outline'}
                                    className={`flex-1 shadow-sm ${myVote === 'maybe' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                                    onClick={() => handleVote(proposal.id, 'maybe')}
                                >
                                    <HelpCircle className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Peut-être</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant={myVote === 'unavailable' ? 'default' : 'outline'}
                                    className={`flex-1 shadow-sm ${myVote === 'unavailable' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
                                    onClick={() => handleVote(proposal.id, 'unavailable')}
                                >
                                    <X className="w-4 h-4 mr-1.5" /> Non
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
