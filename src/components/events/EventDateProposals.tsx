"use client";

import { useState, useEffect, useMemo } from "react";
import { EventDateProposal, EventDateVote } from "@/types/calendar.types";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";
import { createClient } from "@/lib/supabase/client";
import { getEventDateProposals, getEventDateVotes, voteForDateProposal, confirmWinningDate, deleteDateVote } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Check, X, Crown, Trophy } from "lucide-react";

export function EventDateProposals({ eventId, creatorId, proposalsData, onConfirmed }: { eventId: string, creatorId: string, proposalsData: any, onConfirmed: () => void }) {
    const { currentUser } = useSupabaseUsers();
    const supabase = useMemo(() => createClient(), []);

    const [proposals, setProposals] = useState<EventDateProposal[]>([]);
    const [votes, setVotes] = useState<(EventDateVote & { user: { displayName: string, avatarId: string | null } })[]>([]);
    const [isConfirming, setIsConfirming] = useState<string | null>(null);

    const isCreator = currentUser?.id === creatorId;

    useEffect(() => {
        if (!proposalsData) return;
        setProposals(proposalsData.dateProposals.filter((p: any) => p.eventId === eventId));
        setVotes(proposalsData.dateVotes.filter((v: any) =>
            proposalsData.dateProposals.some((p: any) => p.eventId === eventId && p.id === v.proposalId)
        ));
    }, [proposalsData?.dateProposals, proposalsData?.dateVotes, eventId]);

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

    if (!proposalsData || proposals.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                {proposals.map(proposal => {
                    const proposalVotes = votes.filter(v => v.proposalId === proposal.id);
                    const myVote = proposalVotes.find(v => v.userId === currentUser?.id)?.status;

                    const startDate = new Date(proposal.startDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
                    let dateDisplay: string;
                    if (proposal.endDate && proposal.endDate !== proposal.startDate) {
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
                        <div key={proposal.id} className="bg-zinc-950 border border-amber-900/30 rounded-lg p-3 shadow-md flex items-center justify-between gap-3 relative overflow-hidden group">
                            {/* Subtle gold glow on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            {/* Left: Date Display & Voters */}
                            <div className="flex flex-col flex-1 min-w-0 z-10">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                    <span className="font-medium capitalize text-zinc-200 text-sm truncate">
                                        {dateDisplay}
                                    </span>
                                    {proposal.comment && (
                                        <span className="text-xs text-zinc-500 italic truncate max-w-[120px]">
                                            {proposal.comment}
                                        </span>
                                    )}
                                </div>

                                {sortedVotes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5 opacity-90">
                                        {sortedVotes.map(v => (
                                            <div key={v.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium shadow-sm transition-colors ${v.status === 'available' ? 'bg-amber-900/20 border-amber-800/50 text-amber-300' :
                                                v.status === 'unavailable' ? 'bg-red-900/20 border-red-800/50 text-red-400' :
                                                    'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'
                                                }`}>
                                                <UserAvatar user={{ displayName: v.user.displayName, color: '#999' }} className="w-3.5 h-3.5 text-[8px]" />
                                                <span className="hidden sm:inline opacity-80">{v.status === 'available' ? 'Dispo' : v.status === 'unavailable' ? 'Non' : '?'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 z-10 shrink-0">
                                {/* Voting Buttons (Inline) */}
                                <div className="flex items-center bg-zinc-900/80 rounded border border-zinc-800 overflow-hidden shadow-inner">
                                    <button
                                        onClick={() => handleVote(proposal.id, 'available')}
                                        className={`flex items-center justify-center w-8 h-8 transition-all ${myVote === 'available' ? 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-800'}`}
                                        title="Disponible"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-zinc-800"></div>
                                    <button
                                        onClick={() => handleVote(proposal.id, 'unavailable')}
                                        className={`flex items-center justify-center w-8 h-8 transition-all ${myVote === 'unavailable' ? 'bg-red-900/80 text-red-200' : 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800'}`}
                                        title="Indisponible"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Confirmation Button (Creator Only) */}
                                {isCreator && (
                                    <button
                                        onClick={() => handleConfirm(proposal.id)}
                                        disabled={isConfirming === proposal.id}
                                        className="flex items-center justify-center w-9 h-9 rounded-full ml-1 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 hover:border-amber-400 hover:text-amber-400 transition-all focus:outline-none"
                                        title="Choisir cette date"
                                    >
                                        {isConfirming === proposal.id ? (
                                            <span className="animate-pulse">...</span>
                                        ) : (
                                            <Crown className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
