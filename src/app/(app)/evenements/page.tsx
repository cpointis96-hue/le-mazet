"use client";

import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";
import { CalendarEvent } from "@/types/calendar.types";
import Link from "next/link";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Beer, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProposalsData } from "@/hooks/useProposalsData";
import { useState } from "react";
import { EventDetailsModal } from "./EventDetailsModal";
import { UserAvatar } from "@/components/ui/UserAvatar";

// Helper to sort events
function sortEvents(events: CalendarEvent[]) {
    return [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export default function EvenementsPage() {
    const proposalsData = useProposalsData();
    const { events, addEvent, deleteEvent, currentUserId } = useSupabaseEvents(proposalsData.responses);
    const { users } = useSupabaseUsers();

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedEventIsConfirmed, setSelectedEventIsConfirmed] = useState(false);

    const openEvent = (event: CalendarEvent, isConfirmed: boolean) => {
        setSelectedEvent(event);
        setSelectedEventIsConfirmed(isConfirmed);
    };

    const handleQuickDrink = async () => {
        const today = new Date();
        await addEvent({
            title: "Boire un coup ce soir 🍻",
            description: "Spontané ! Qui est chaud ?",
            startDate: format(today, "yyyy-MM-dd"),
            endDate: format(today, "yyyy-MM-dd"),
            startTime: "19:00",
            endTime: "23:00",
            allDay: false,
            color: "#f59e0b",
            icon: "Beer",
            privacy: "public_details" as const,
            status: "proposed" as const,
        });
    };

    const proposedEvents = events.filter(e => {
        if (e.status === 'confirmed') return false;
        const availableCount = proposalsData.responses.filter((r: any) => r.eventId === e.id && r.status === 'available').length;
        return availableCount < 2;
    });

    const confirmedEvents = events.filter(e => {
        if (e.status === 'confirmed') return true;
        const availableCount = proposalsData.responses.filter((r: any) => r.eventId === e.id && r.status === 'available').length;
        return availableCount >= 2;
    });

    const sortedProposed = sortEvents(proposedEvents);
    const sortedConfirmed = sortEvents(confirmedEvents);

    return (
        <div className="h-full flex flex-col gap-5 overflow-y-auto pb-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">On se voit quand ?</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Proposez, votez, et c'est noté.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/evenements/nouveau?type=proposal"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/10 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Lancer
                    </Link>
                    <button
                        onClick={handleQuickDrink}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-500 hover:bg-amber-500/20 transition-colors"
                    >
                        <Beer className="w-3.5 h-3.5" />
                        Ce soir ?
                    </button>
                </div>
            </div>

            {/* Section À voter */}
            <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">À voter</span>
                    {proposedEvents.length > 0 && (
                        <span className="text-[10px] font-semibold bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full">
                            {proposedEvents.length}
                        </span>
                    )}
                </div>

                {proposedEvents.length === 0 ? (
                    <div className="py-6 text-center border border-dashed border-white/10 rounded-xl text-sm">
                        <p className="text-foreground/60 font-medium text-sm">C'est calme par ici.</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Lancez une idée pour réveiller le groupe !</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {sortedProposed.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                users={users}
                                proposalsData={proposalsData}
                                isConfirmed={false}
                                onClick={() => openEvent(event, false)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Section C'est noté */}
            <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">C'est noté</span>
                    {confirmedEvents.length > 0 && (
                        <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">
                            {confirmedEvents.length}
                        </span>
                    )}
                </div>

                {confirmedEvents.length === 0 ? (
                    <div className="py-6 text-center border border-dashed border-white/10 rounded-xl text-sm">
                        <p className="text-foreground/60 font-medium text-sm">Pas encore de plans fixés.</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Votez plus haut et ça va vite changer !</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {sortedConfirmed.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                users={users}
                                proposalsData={proposalsData}
                                isConfirmed={true}
                                onClick={() => openEvent(event, true)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    isOpen={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    users={users}
                    proposalsData={proposalsData}
                    isConfirmed={selectedEventIsConfirmed}
                    onDelete={selectedEvent.userId === currentUserId ? () => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
                            setSelectedEvent(null);
                            deleteEvent(selectedEvent.id);
                        }
                    } : undefined}
                    onEdit={selectedEvent.userId === currentUserId ? () => {
                        // redirect to edit page with event ID
                        window.location.href = `/evenements/nouveau?edit=${selectedEvent.id}`;
                    } : undefined}
                />
            )}
        </div>
    );
}

function EventCard({ event, users, proposalsData, isConfirmed = false, onClick }: {
    event: CalendarEvent;
    users: any[];
    proposalsData: any;
    isConfirmed?: boolean;
    onClick?: () => void;
}) {
    const creator = users.find((u: any) => u.id === event.userId);
    const isMultiDate = event.isMultiDate && event.status === 'proposed';

    const dateFormatted = format(new Date(event.startDate + 'T00:00:00'), 'd MMMM yyyy', { locale: fr });

    const timeFormatted = !event.allDay && event.startTime
        ? event.startTime.slice(0, 5)
        : null;

    const eventResponses = proposalsData.responses.filter((r: any) => r.eventId === event.id);
    const userResponse = eventResponses.find((r: any) => r.userId === proposalsData.currentUserId)?.status;

    const availableVoters = eventResponses
        .filter((r: any) => r.status === 'available')
        .map((r: any) => users.find((u: any) => u.id === r.userId))
        .filter(Boolean);

    const unavailableVoters = eventResponses
        .filter((r: any) => r.status === 'unavailable')
        .map((r: any) => users.find((u: any) => u.id === r.userId))
        .filter(Boolean);

    const accentColor = isConfirmed
        ? '#10b981'
        : (event.color || '#8b5cf6');

    return (
        <div
            onClick={onClick}
            className="relative bg-card rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/3 cursor-pointer transition-all overflow-hidden"
        >
            {/* Accent bar gauche */}
            <div
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ backgroundColor: accentColor }}
            />

            <div className="px-4 py-3 pl-5 flex flex-col gap-2.5">
                {/* Ligne 1 : titre + badge */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-snug truncate">{event.title}</h3>
                    </div>

                    {/* Infos Date à droite */}
                    <div className="flex items-center gap-2 shrink-0">
                        {timeFormatted && <span className="text-xs text-muted-foreground whitespace-nowrap">{timeFormatted}</span>}
                        <span className="text-sm text-foreground/80 lowercase whitespace-nowrap">
                            {dateFormatted}
                        </span>
                        {/* Badge statut */}
                        {isConfirmed ? (
                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                C'est noté ✓
                            </span>
                        ) : isMultiDate ? (
                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                Sondage
                            </span>
                        ) : (
                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                Proposition
                            </span>
                        )}
                    </div>
                </div>

                {/* Second line if needed for Creator */}
                {creator && (
                    <div className="flex items-center text-[10px] text-muted-foreground/60 -mt-1 font-medium">
                        par {creator.displayName}
                    </div>
                )}

                {/* Description */}
                {event.description && (
                    <p className="text-xs text-muted-foreground/70 line-clamp-1 pl-0.5">
                        {event.description}
                    </p>
                )}

                {/* Deadline sondage */}
                {isMultiDate && event.pollDeadline && (
                    <p className="text-[10px] text-red-400 font-medium">
                        ⏳ Réponse avant le {format(new Date(event.pollDeadline), 'd MMM', { locale: fr })}
                    </p>
                )}

                {/* Ligne basse : facepile + action vote */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
                    {/* Listes des dispos / pas dispos */}
                    <div className="flex flex-col gap-0.5 flex-1">
                        {availableVoters.length > 0 && (
                            <div className="text-[10px] text-white">
                                <span className="text-emerald-500 font-bold mr-1">Dispos :</span>
                                {availableVoters.map((u: any) => u.displayName).join(', ')}
                            </div>
                        )}
                        {unavailableVoters.length > 0 && (
                            <div className="text-[10px] text-white/50">
                                <span className="text-red-500 font-bold mr-1">Pas là :</span>
                                {unavailableVoters.map((u: any) => u.displayName).join(', ')}
                            </div>
                        )}
                        {availableVoters.length === 0 && unavailableVoters.length === 0 && (
                            <span className="text-[10px] text-muted-foreground/50 italic">Personne n'a encore voté</span>
                        )}
                    </div>

                    {/* Action vote */}
                    {isMultiDate ? (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 pointer-events-none">
                            Choisir <ChevronRight className="w-3 h-3" />
                        </div>
                    ) : userResponse ? (
                        <div
                            onClick={e => e.stopPropagation()}
                            className="flex gap-1.5"
                        >
                            <button
                                onClick={() => proposalsData.setResponse(event.id, 'available', userResponse)}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border",
                                    userResponse === 'available'
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                        : 'border-white/10 text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-500'
                                )}
                            >
                                ✓
                            </button>
                            <button
                                onClick={() => proposalsData.setResponse(event.id, 'unavailable', userResponse)}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border",
                                    userResponse === 'unavailable'
                                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                                        : 'border-white/10 text-muted-foreground hover:border-red-500/30 hover:text-red-500'
                                )}
                            >
                                ✗
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={e => e.stopPropagation()}
                            className="flex gap-1.5"
                        >
                            <button
                                onClick={() => proposalsData.setResponse(event.id, 'available', userResponse)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-white/10 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
                            >
                                ✓ Présent
                            </button>
                            <button
                                onClick={() => proposalsData.setResponse(event.id, 'unavailable', userResponse)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-all"
                            >
                                ✗ Pas là
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
