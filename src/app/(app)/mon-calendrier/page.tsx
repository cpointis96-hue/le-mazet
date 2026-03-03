"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { MonthView } from "@/components/calendar/MonthView";
import { YearView } from "@/components/calendar/YearView";
import { AgendaView } from "@/components/calendar/AgendaView";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCalendarView } from "@/hooks/useCalendarView";
import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";
import { useAvailabilities } from "@/hooks/useAvailabilities";
import { useProposalsData } from "@/hooks/useProposalsData";
import { CalendarEvent } from "@/types/calendar.types";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { EventForm } from "@/components/events/EventForm";
import { EventDetailsModal } from "../evenements/EventDetailsModal";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";

export default function MonCalendrierPage() {
    const { viewMode, setViewMode, currentDate, handlePrev, handleNext, navigationLabel } = useCalendarView("mois");
    const { availabilities, currentUserId, toggleAvailability } = useAvailabilities();
    const { users } = useSupabaseUsers();
    const proposalsData = useProposalsData();
    const { personalEvents, addEvent, updateEvent, deleteEvent } = useSupabaseEvents(proposalsData.responses);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDayListOpen, setIsDayListOpen] = useState(false);
    const [dayListEvents, setDayListEvents] = useState<CalendarEvent[]>([]);

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
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayEvents = personalEvents.filter(e => e.startDate <= dateStr && e.endDate >= dateStr);
        setSelectedDate(date);
        if (dayEvents.length > 0) {
            setDayListEvents(dayEvents);
            setIsDayListOpen(true);
        } else {
            setIsFormOpen(true);
        }
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsDetailOpen(true);
    };

    const handleFormSubmit = (data: any, files?: File[]) => {
        if (selectedEvent) {
            updateEvent(selectedEvent.id, data, files);
        } else {
            addEvent(data, files);
        }
        setIsFormOpen(false);
        setSelectedEvent(null);
    };

    const eventsKey = personalEvents.length;

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Mon Calendrier</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Gérez vos événements personnels</p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
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

            {/* Body */}
            {viewMode === 'mois' ? (
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
                    <div
                        className="shrink-0"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <p className="text-sm font-semibold capitalize mb-2 px-1">
                            {format(currentDate, 'MMMM yyyy', { locale: fr })}
                        </p>
                        <div className="h-[280px]">
                            <MonthView
                                key={`month-${eventsKey}-${availabilities.length}`}
                                currentDate={currentDate}
                                events={personalEvents}
                                availabilities={availabilities.filter(a => a.userId === currentUserId)}
                                onToggleAvailability={(date, status) => toggleAvailability(date, status)}
                                onDayClick={handleDayClick}
                                onEventClick={handleEventClick}
                            />
                        </div>
                    </div>
                    <div className="flex-1 pb-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">À venir</p>
                        <AgendaView
                            events={personalEvents}
                            onEventClick={handleEventClick}
                        />
                    </div>
                </div>
            ) : (
                <div
                    className="flex-1 min-h-0 overflow-y-auto"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <YearView
                        currentYear={currentDate}
                        events={personalEvents}
                        onDayClick={handleDayClick}
                    />
                </div>
            )}

            {/* Dialog liste des événements du jour */}
            <Dialog open={isDayListOpen} onOpenChange={setIsDayListOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDate ? format(selectedDate, 'EEEE d MMMM', { locale: fr }) : ''}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-2">
                        <button
                            onClick={() => { setIsDayListOpen(false); setIsFormOpen(true); }}
                            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors py-1"
                        >
                            <Plus className="w-4 h-4" /> Créer un événement
                        </button>
                        <div className="flex flex-col gap-1.5 border-t pt-3">
                            {dayListEvents.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => { setIsDayListOpen(false); setSelectedEvent(event); setIsDetailOpen(true); }}
                                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 hover:border-border transition-colors text-left w-full"
                                >
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: event.color || '#7c6ff7' }} />
                                    <span className="text-sm font-medium truncate flex-1">{event.title}</span>
                                    {!event.allDay && event.startTime && (
                                        <span className="text-xs text-muted-foreground shrink-0">{event.startTime.slice(0, 5)}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Creating or Editing Event */}
            <Dialog open={isFormOpen} onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) setSelectedEvent(null);
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEvent ? "Modifier l'événement" : "Nouvel événement"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <EventForm
                            initialData={selectedEvent || {
                                startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
                                endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
                                status: 'proposed',
                            } as any}
                            onSubmit={handleFormSubmit}
                            onCancel={() => {
                                setIsFormOpen(false);
                                setSelectedEvent(null);
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Viewing Event */}
            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    isOpen={isDetailOpen}
                    onClose={() => {
                        setIsDetailOpen(false);
                        setSelectedEvent(null);
                    }}
                    users={users}
                    proposalsData={proposalsData}
                    onEdit={() => {
                        setIsDetailOpen(false);
                        setIsFormOpen(true);
                    }}
                    onDelete={() => {
                        deleteEvent(selectedEvent.id);
                        setIsDetailOpen(false);
                        setSelectedEvent(null);
                    }}
                />
            )}
        </div>
    );
}
