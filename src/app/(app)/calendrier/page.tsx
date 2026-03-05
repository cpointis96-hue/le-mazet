"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

export default function CalendrierCommunPage() {
    const { viewMode, setViewMode, currentDate, handlePrev, handleNext, navigationLabel } = useCalendarView("mois");
    const { proposalsData, eventsData, usersData, availabilitiesData } = useAppData();
    const { availabilities } = availabilitiesData;
    const { sharedEvents, events, currentUserId } = eventsData;
    const { users } = usersData;

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEventDetails, setSelectedEventDetails] = useState<CalendarEvent | null>(null);

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
        setIsDialogOpen(true);
    };

    return (
        <div className="h-full flex flex-col gap-4">
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

            {/* Contenu calendrier */}
            {viewMode === 'mois' ? (
                <div
                    className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2"
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
                    className="flex-1 min-h-0 overflow-y-auto"
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

            {/* Modale des Disponibilités */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 flex flex-col gap-6">
                        {/* Section Disponibilités */}
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
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border",
                                                    userStatus === 'available'
                                                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
                                                        : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                                                )}>
                                                    <span className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        userStatus === 'available' ? "bg-green-500" : "bg-red-500"
                                                    )} />
                                                    {userStatus === 'available' ? 'Disponible' : 'Occupé(e)'}
                                                </span>
                                            </div>
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

                        {/* Section Événements */}
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
                                        const isProposed = event.status === 'proposed';

                                        return (
                                            <div
                                                key={event.id}
                                                onClick={() => setSelectedEventDetails(event)}
                                                className={cn(
                                                    "border p-3 rounded-xl flex flex-col gap-2 transition-colors",
                                                    "bg-card hover:bg-muted/50 cursor-pointer shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                                                        <span className="font-semibold">
                                                            {event.title}
                                                        </span>
                                                        {isProposed && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                                                                Proposition
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs flex items-center">
                                                        <UserAvatar user={creator} />
                                                    </div>
                                                </div>
                                                {isProposed && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Cliquez pour voter ou commenter...
                                                    </div>
                                                )}
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
                    onClose={() => setSelectedEventDetails(null)}
                    users={users}
                    proposalsData={proposalsData}
                />
            )}
        </div>
    );
}
