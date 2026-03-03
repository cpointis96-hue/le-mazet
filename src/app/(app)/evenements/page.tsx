"use client";

import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";
import { CalendarEvent } from "@/types/calendar.types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Beer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProposalsData } from "@/hooks/useProposalsData";
import { useState } from "react";
import { EventDetailsModal } from "./EventDetailsModal";

export default function EvenementsPage() {
    const proposalsData = useProposalsData();
    const { events, addEvent } = useSupabaseEvents(proposalsData.responses);
    const { users } = useSupabaseUsers();

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedEventIsConfirmed, setSelectedEventIsConfirmed] = useState(false);

    const openEvent = (event: CalendarEvent, isConfirmed: boolean) => {
        setSelectedEvent(event);
        setSelectedEventIsConfirmed(isConfirmed);
    };

    const handleQuickDrink = async () => {
        const today = new Date();
        const eventData = {
            title: "Boire un coup ce soir 🍻",
            description: "Spontané ! Qui est chaud ?",
            startDate: format(today, "yyyy-MM-dd"),
            endDate: format(today, "yyyy-MM-dd"),
            startTime: "19:00",
            endTime: "23:00",
            allDay: false,
            color: "#f59e0b", // Amber
            icon: "Beer",
            privacy: "public_details" as const,
            status: "proposed" as const
        };
        // L'ajout passera par useSupabaseEvents qui gère le refetch via Realtime
        await addEvent(eventData);
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

    return (
        <div className="h-full flex flex-col gap-6 p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pl-10 lg:pl-0">
                <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">On se voit quand ?</h1>
                        <Link href="/evenements/nouveau?type=proposal" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            Lancer une idée
                        </Link>
                        <button onClick={handleQuickDrink} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors">
                            <Beer className="w-3.5 h-3.5" />
                            Un verre ce soir ?
                        </button>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">Proposez, votez, et c'est noté.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0 overflow-y-auto pr-2 pb-10">
                {/* Colonne À voter */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-base font-semibold uppercase tracking-widest text-foreground/60">À voter</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Dites-nous si vous êtes de la partie !</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {proposedEvents.length === 0 ? (
                            <div className="p-8 text-center border border-dashed rounded-xl bg-muted/10 text-sm">
                                <p className="text-foreground/70 font-medium">C'est un peu trop calme par ici.</p>
                                <p className="text-muted-foreground mt-1">Lancez une idée pour réveiller le groupe !</p>
                            </div>
                        ) : (
                            proposedEvents.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    users={users}
                                    proposalsData={proposalsData}
                                    isConfirmed={false}
                                    onClick={() => openEvent(event, false)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Colonne C'est noté */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-base font-semibold uppercase tracking-widest text-foreground/60">C'est noté</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">On se voit !</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {confirmedEvents.length === 0 ? (
                            <div className="p-8 text-center border border-dashed rounded-xl bg-muted/10 text-sm">
                                <p className="text-foreground/70 font-medium">Pas encore de plans fixés.</p>
                                <p className="text-muted-foreground mt-1">Votez à gauche et ça va vite changer !</p>
                            </div>
                        ) : (
                            confirmedEvents.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    users={users}
                                    proposalsData={proposalsData}
                                    isConfirmed={true}
                                    onClick={() => openEvent(event, true)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    isOpen={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    users={users}
                    proposalsData={proposalsData}
                    isConfirmed={selectedEventIsConfirmed}
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
    const creator = users.find(u => u.id === event.userId);
    const dateFormatted = format(new Date(event.startDate), 'EEEE d MMMM yyyy', { locale: fr });

    const eventResponses = proposalsData.responses.filter((r: any) => r.eventId === event.id);
    const userResponse = eventResponses.find((r: any) => r.userId === proposalsData.currentUserId)?.status;

    const availableVoters = eventResponses
        .filter((r: any) => r.status === 'available')
        .map((r: any) => users.find(u => u.id === r.userId)?.displayName || 'Inconnu');
    const unavailableVoters = eventResponses
        .filter((r: any) => r.status === 'unavailable')
        .map((r: any) => users.find(u => u.id === r.userId)?.displayName || 'Inconnu');

    const accentColor = isConfirmed ? 'border-l-emerald-500' : 'border-l-violet-500';

    return (
        <div
            onClick={onClick}
            className={cn(
                "border-l-4 bg-card px-5 py-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4 cursor-pointer",
                accentColor
            )}
        >
            {/* Header : titre + créateur dans la date */}
            <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-xl leading-tight">{event.title}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                    {event.isMultiDate && event.status === 'proposed' ? (
                        <span className="text-amber-600 dark:text-amber-500 font-medium">Plusieurs dates en propositions</span>
                    ) : (
                        dateFormatted
                    )}
                    {creator && (
                        <span className="text-foreground/40"> · Par {creator.displayName}</span>
                    )}
                </p>
                {event.isMultiDate && event.status === 'proposed' && event.pollDeadline && (
                    <div className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 w-fit px-2 py-1 rounded-md border border-red-200 dark:border-red-900/50">
                        ⏳ Réponse attendue avant le {format(new Date(event.pollDeadline), 'd MMMM', { locale: fr })}
                    </div>
                )}
            </div>

            {event.description && (
                <p className="text-sm text-foreground/70 line-clamp-2 border-l-2 border-muted pl-3">
                    {event.description}
                </p>
            )}

            {/* Votes */}
            {!(event.isMultiDate && event.status === 'proposed') && (availableVoters.length > 0 || unavailableVoters.length > 0) && (
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/50">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600/80 block mb-0.5">Présents</span>
                        <span className="text-foreground/70">
                            {availableVoters.length > 0 ? availableVoters.join(', ') : <span className="text-muted-foreground/50 italic text-xs">—</span>}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-red-500/80 block mb-0.5">Pas là</span>
                        <span className="text-foreground/70">
                            {unavailableVoters.length > 0 ? unavailableVoters.join(', ') : <span className="text-muted-foreground/50 italic text-xs">—</span>}
                        </span>
                    </div>
                </div>
            )}

            {/* Boutons de vote ou Placeholder Sondage */}
            <div
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-3 pt-3 border-t border-border/50"
            >
                {event.isMultiDate && event.status === 'proposed' ? (
                    <div className="w-full text-center text-xs font-semibold text-amber-600 dark:text-amber-500 py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
                        Cliquez pour choisir les dates
                    </div>
                ) : (
                    <>
                        <span className="text-xs font-medium text-muted-foreground shrink-0">Vous êtes là ?</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => proposalsData.setResponse(event.id, 'available', userResponse)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                                    userResponse === 'available'
                                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                                        : 'bg-transparent border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-600'
                                )}
                            >
                                Présent
                            </button>
                            <button
                                onClick={() => proposalsData.setResponse(event.id, 'unavailable', userResponse)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                                    userResponse === 'unavailable'
                                        ? 'bg-red-500 border-red-600 text-white shadow-sm'
                                        : 'bg-transparent border-border text-muted-foreground hover:border-red-400 hover:text-red-600'
                                )}
                            >
                                Pas là
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
