"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarNavigation } from "@/components/calendar/CalendarNavigation";
import { MonthViewShared } from "@/components/calendar/MonthViewShared";
import { YearViewShared } from "@/components/calendar/YearViewShared";
import { useCalendarView } from "@/hooks/useCalendarView";
import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";
import { useAvailabilities } from "@/hooks/useAvailabilities";
import { useProposalsData } from "@/hooks/useProposalsData";
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
    const proposalsData = useProposalsData();
    const { availabilities } = useAvailabilities();
    const { sharedEvents, events, currentUserId } = useSupabaseEvents(proposalsData.responses);
    const { users } = useSupabaseUsers();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEventDetails, setSelectedEventDetails] = useState<CalendarEvent | null>(null);

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsDialogOpen(true);
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendrier Commun</h1>
                    <p className="text-muted-foreground text-sm">Tous les événements publics sont visibles ici !</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                    {/* Sélecteur mois / année */}
                    <div className="flex items-center rounded-lg border overflow-hidden">
                        <button
                            onClick={() => setViewMode('mois')}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium transition-colors",
                                viewMode === 'mois'
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground"
                            )}
                        >
                            Mois
                        </button>
                        <button
                            onClick={() => setViewMode('annee')}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium transition-colors",
                                viewMode === 'annee'
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground"
                            )}
                        >
                            Année
                        </button>
                    </div>

                    <CalendarNavigation
                        label={navigationLabel}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                </div>
            </div>

            {/* Contenu calendrier */}
            <div className={cn(
                "flex-1 min-h-0",
                viewMode === 'annee' ? "overflow-y-auto" : "relative"
            )}>
                {viewMode === 'mois' ? (
                    <MonthViewShared
                        currentDate={currentDate}
                        events={sharedEvents}
                        availabilities={availabilities}
                        onDayClick={handleDayClick}
                    />
                ) : (
                    <YearViewShared
                        currentYear={currentDate}
                        sharedEvents={sharedEvents}
                        availabilities={availabilities}
                        onDayClick={handleDayClick}
                    />
                )}
            </div>

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
                                        const isPrivate = event.privacy === 'prive' && event.userId !== currentUserId;
                                        const creator = users.find(u => u.id === event.userId);
                                        const isProposed = event.status === 'proposed';

                                        return (
                                            <div
                                                key={event.id}
                                                onClick={() => !isPrivate && setSelectedEventDetails(event)}
                                                className={cn(
                                                    "border p-3 rounded-xl flex flex-col gap-2 transition-colors",
                                                    isPrivate ? "bg-muted/30 border-dashed" : "bg-card hover:bg-muted/50 cursor-pointer shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                                                        <span className="font-semibold">
                                                            {isPrivate ? "Occupé" : event.title}
                                                        </span>
                                                        {isProposed && !isPrivate && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                                                                Proposition
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!isPrivate && (
                                                        <div className="text-xs flex items-center">
                                                            <UserAvatar user={creator} />
                                                        </div>
                                                    )}
                                                </div>
                                                {!isPrivate && isProposed && (
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
