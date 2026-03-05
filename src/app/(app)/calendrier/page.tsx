"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonthViewShared } from "@/components/calendar/MonthViewShared";
import { YearViewShared } from "@/components/calendar/YearViewShared";
import { useCalendarView } from "@/hooks/useCalendarView";
import { useAppData } from "@/contexts/AppDataContext";
import { EventDetailsModal } from "../evenements/EventDetailsModal";
import { CalendarEvent } from "@/types/calendar.types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

function sortEvents(events: CalendarEvent[]) {
    return [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export default function CalendrierCommunPage() {
    const router = useRouter();
    const { viewMode, setViewMode, currentDate, handlePrev, handleNext, navigationLabel } = useCalendarView("mois");
    const { proposalsData, eventsData, usersData, availabilitiesData } = useAppData();
    const { availabilities } = availabilitiesData;
    const { sharedEvents, events, currentUserId, deleteEvent, refreshEvents } = eventsData;
    const { users } = usersData;

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
    const [selectedEventDetails, setSelectedEventDetails] = useState<CalendarEvent | null>(null);
    const [selectedEventIsConfirmed, setSelectedEventIsConfirmed] = useState(false);

    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            dx < 0 ? handleNext() : handlePrev();
        }
    };

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsDayDialogOpen(true);
    };

    const openEvent = (event: CalendarEvent) => {
        setSelectedEventDetails(event);
        setSelectedEventIsConfirmed(event.status === 'confirmed');
    };

    const proposedEvents = sortEvents(events.filter(e => e.status === 'proposed'));
    const confirmedEvents = sortEvents(events.filter(e => e.status === 'confirmed'));

    return (
        <div className="flex flex-col gap-4 pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Calendrier Commun</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Tous les événements publics sont visibles ici !</p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    <span className="text-sm font-medium text-muted-foreground capitalize hidden sm:inline">{navigationLabel}</span>
                    <div className="flex items-center rounded-xl border overflow-hidden bg-muted/30 p-0.5 gap-0.5">
                        {(['mois', 'annee'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode as any)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200",
                                    viewMode === mode
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {mode === 'mois' ? 'Mois' : 'Année'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendrier */}
            {viewMode === 'mois' ? (
                <div
                    className="flex flex-col gap-2"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <p className="text-sm font-semibold capitalize shrink-0 px-1">
                        {format(currentDate, 'MMMM yyyy', { locale: fr })}
                    </p>
                    <MonthViewShared
                        currentDate={currentDate}
                        events={sharedEvents}
                        availabilities={availabilities}
                        onDayClick={handleDayClick}
                    />
                </div>
            ) : (
                <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <YearViewShared
                        currentYear={currentDate}
                        sharedEvents={sharedEvents}
                        availabilities={availabilities}
                        onDayClick={handleDayClick}
                    />
                </div>
            )}

            {/* ─── Liste des événements ─── */}
            <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold tracking-tight">Événements</h2>
                    <Link
                        href="/evenements/nouveau"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/10 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nouveau
                    </Link>
                </div>

                {/* À voter */}
                {proposedEvents.length > 0 && (
                    <section className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            À voter
                            <span className="text-[10px] font-semibold bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full">
                                {proposedEvents.length}
                            </span>
                        </span>
                        {proposedEvents.map(event => (
                            <EventRow
                                key={event.id}
                                event={event}
                                users={users}
                                proposalsData={proposalsData}
                                onClick={() => openEvent(event)}
                            />
                        ))}
                    </section>
                )}

                {/* Confirmés */}
                <section className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        C'est noté
                        {confirmedEvents.length > 0 && (
                            <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">
                                {confirmedEvents.length}
                            </span>
                        )}
                    </span>
                    {confirmedEvents.length === 0 ? (
                        <div className="py-5 text-center border border-dashed border-white/10 rounded-xl text-sm">
                            <p className="text-foreground/60 font-medium text-sm">Pas encore de plans fixés.</p>
                            <p className="text-muted-foreground text-xs mt-0.5">Votez plus haut et ça va vite changer !</p>
                        </div>
                    ) : (
                        confirmedEvents.map(event => (
                            <EventRow
                                key={event.id}
                                event={event}
                                users={users}
                                proposalsData={proposalsData}
                                onClick={() => openEvent(event)}
                            />
                        ))
                    )}
                </section>
            </div>

            {/* Modale clic sur un jour */}
            <Dialog open={isDayDialogOpen} onOpenChange={setIsDayDialogOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 flex flex-col gap-6">
                        {/* Disponibilités */}
                        <div>
                            <h3 className="font-semibold text-lg mb-3">Disponibilités</h3>
                            <div className="flex flex-col gap-3">
                                {users.filter(user => {
                                    const dStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
                                    return availabilities.some(a => a.userId === user.id && a.date === dStr && (a.status === 'available' || a.status === 'busy'));
                                }).map(user => {
                                    const dStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
                                    const userStatus = availabilities.find(a => a.userId === user.id && a.date === dStr)?.status;
                                    return (
                                        <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <UserAvatar user={user} className="text-base" />
                                                {user.isCurrentUser && <span className="text-muted-foreground text-xs">(Moi)</span>}
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border",
                                                userStatus === 'available'
                                                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
                                                    : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                                            )}>
                                                <span className={cn("w-2 h-2 rounded-full", userStatus === 'available' ? "bg-green-500" : "bg-red-500")} />
                                                {userStatus === 'available' ? 'Disponible' : 'Occupé(e)'}
                                            </span>
                                        </div>
                                    );
                                })}
                                {users.filter(user => {
                                    const dStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
                                    return availabilities.some(a => a.userId === user.id && a.date === dStr && (a.status === 'available' || a.status === 'busy'));
                                }).length === 0 && (
                                    <p className="text-center text-muted-foreground text-sm py-4">Personne n'a encore indiqué sa disponibilité pour ce jour.</p>
                                )}
                            </div>
                        </div>

                        {/* Événements du jour */}
                        <div>
                            <h3 className="font-semibold text-lg mb-3">Événements & Propositions</h3>
                            <div className="flex flex-col gap-3">
                                {(() => {
                                    if (!selectedDate) return null;
                                    const dStr = format(selectedDate, 'yyyy-MM-dd');
                                    const dayEventsRaw = events.filter(e => e.startDate <= dStr && e.endDate >= dStr);
                                    if (dayEventsRaw.length === 0) {
                                        return <p className="text-sm text-muted-foreground">Aucun événement ce jour.</p>;
                                    }
                                    return dayEventsRaw.map(event => {
                                        const creator = users.find(u => u.id === event.userId);
                                        return (
                                            <div
                                                key={event.id}
                                                onClick={() => { setIsDayDialogOpen(false); openEvent(event); }}
                                                className="border p-3 rounded-xl flex flex-col gap-2 transition-colors bg-card hover:bg-muted/50 cursor-pointer shadow-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                                                        <span className="font-semibold">{event.title}</span>
                                                        {event.status === 'proposed' && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                                                                Proposition
                                                            </span>
                                                        )}
                                                    </div>
                                                    <UserAvatar user={creator} />
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {selectedEventDetails && (
                <EventDetailsModal
                    event={selectedEventDetails}
                    isOpen={!!selectedEventDetails}
                    onClose={() => { setSelectedEventDetails(null); refreshEvents(); }}
                    users={users}
                    proposalsData={proposalsData}
                    isConfirmed={selectedEventIsConfirmed}
                    onEdit={selectedEventDetails.userId === currentUserId ? () => {
                        setSelectedEventDetails(null);
                        router.push(`/evenements/nouveau?edit=${selectedEventDetails.id}`);
                    } : undefined}
                    onDelete={selectedEventDetails.userId === currentUserId ? () => {
                        deleteEvent(selectedEventDetails.id);
                        setSelectedEventDetails(null);
                    } : undefined}
                />
            )}
        </div>
    );
}

function EventRow({ event, users, proposalsData, onClick }: {
    event: CalendarEvent;
    users: any[];
    proposalsData: any;
    onClick: () => void;
}) {
    const creator = users.find((u: any) => u.id === event.userId);
    const isMultiDate = event.isMultiDate && event.status === 'proposed';
    const isConfirmed = event.status === 'confirmed';

    const dateFormatted = format(new Date(event.startDate + 'T00:00:00'), 'd MMM yyyy', { locale: fr });
    const timeFormatted = !event.allDay && event.startTime ? event.startTime.slice(0, 5) : null;

    const eventResponses = proposalsData.responses.filter((r: any) => r.eventId === event.id);
    const availableVoters = eventResponses
        .filter((r: any) => r.status === 'available')
        .map((r: any) => users.find((u: any) => u.id === r.userId))
        .filter(Boolean);
    const unavailableVoters = eventResponses
        .filter((r: any) => r.status === 'unavailable')
        .map((r: any) => users.find((u: any) => u.id === r.userId))
        .filter(Boolean);

    const accentColor = isConfirmed ? '#10b981' : (event.color || '#8b5cf6');

    return (
        <div
            onClick={onClick}
            className="relative bg-card rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/3 cursor-pointer transition-all overflow-hidden"
        >
            <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: accentColor }} />
            <div className="px-4 py-3 pl-5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-snug truncate">{event.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {timeFormatted && <span className="text-xs text-muted-foreground">{timeFormatted}</span>}
                        <span className="text-sm text-foreground/80 lowercase">{dateFormatted}</span>
                        {isConfirmed ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">✓</span>
                        ) : isMultiDate ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Sondage</span>
                        ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Proposition</span>
                        )}
                    </div>
                </div>

                {creator && (
                    <div className="text-[10px] text-muted-foreground/60 -mt-1 font-medium">par {creator.displayName}</div>
                )}

                {event.description && (
                    <p className="text-xs text-muted-foreground/70 line-clamp-1">{event.description}</p>
                )}

                <div className="flex flex-col gap-0.5 pt-1 border-t border-white/5">
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
            </div>
        </div>
    );
}
