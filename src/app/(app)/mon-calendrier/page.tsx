"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CalendarNavigation } from "@/components/calendar/CalendarNavigation";
import { CalendarSwitcher } from "@/components/calendar/CalendarSwitcher";
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
import { EventDetail } from "@/components/events/EventDetail";

export default function MonCalendrierPage() {
    const { viewMode, setViewMode, currentDate, handlePrev, handleNext, navigationLabel } = useCalendarView("mois");
    const { availabilities, currentUserId, toggleAvailability } = useAvailabilities();
    const proposalsData = useProposalsData();
    const { personalEvents, addEvent, updateEvent, deleteEvent } = useSupabaseEvents(proposalsData.responses);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDayListOpen, setIsDayListOpen] = useState(false);
    const [dayListEvents, setDayListEvents] = useState<CalendarEvent[]>([]);
    // Mobile view mode: 'agenda' | 'mois' | 'annee'
    const [mobileView, setMobileView] = useState<'agenda' | 'mois' | 'annee'>('agenda');

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

    // Use a key to force re-render when events array length changes for local state reactivity
    const eventsKey = personalEvents.length;

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Mon Calendrier</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Gérez vos événements personnels</p>
                </div>

                {/* Mobile view switcher tabs (hidden on desktop) */}
                <div className="flex lg:hidden items-center rounded-xl border overflow-hidden bg-muted/30 p-0.5 gap-0.5">
                    {(['agenda', 'mois', 'annee'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setMobileView(mode)}
                            className={cn(
                                "flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200",
                                mobileView === mode
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {mode === 'agenda' ? 'Agenda' : mode === 'mois' ? 'Mois' : 'Année'}
                        </button>
                    ))}
                </div>

                {/* Desktop view switcher (hidden on mobile) */}
                <div className="hidden lg:flex items-center gap-2 sm:gap-4 self-end md:self-auto w-auto">
                    <CalendarNavigation
                        label={navigationLabel}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                    <CalendarSwitcher viewMode={viewMode} onChange={setViewMode} />
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                {/* Mobile: show selected mobile view */}
                <div className="lg:hidden h-full overflow-y-auto">
                    {mobileView === 'agenda' && (
                        <AgendaView
                            events={personalEvents}
                            onEventClick={handleEventClick}
                        />
                    )}
                    {mobileView === 'mois' && (
                        <MonthView
                            key={`month-${eventsKey}-${availabilities.length}`}
                            currentDate={currentDate}
                            events={personalEvents}
                            availabilities={availabilities.filter(a => a.userId === currentUserId)}
                            onToggleAvailability={(date, status) => toggleAvailability(date, status)}
                            onDayClick={handleDayClick}
                            onEventClick={handleEventClick}
                        />
                    )}
                    {mobileView === 'annee' && (
                        <YearView
                            currentYear={currentDate}
                            events={personalEvents}
                            onDayClick={handleDayClick}
                        />
                    )}
                </div>

                {/* Desktop: show selected desktop view */}
                <div className="hidden lg:block h-full">
                    {viewMode === 'mois' ? (
                        <MonthView
                            key={`month-${eventsKey}-${availabilities.length}`}
                            currentDate={currentDate}
                            events={personalEvents}
                            availabilities={availabilities.filter(a => a.userId === currentUserId)}
                            onToggleAvailability={(date, status) => toggleAvailability(date, status)}
                            onDayClick={handleDayClick}
                            onEventClick={handleEventClick}
                        />
                    ) : (
                        <YearView
                            currentYear={currentDate}
                            events={personalEvents}
                            onDayClick={handleDayClick}
                        />
                    )}
                </div>
            </div>

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
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Viewing Event */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Détails</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        {selectedEvent && (
                            <>
                                <EventDetail event={selectedEvent} />
                                <div className="flex gap-2 justify-end mt-6 border-t pt-4">
                                    <button
                                        onClick={() => {
                                            deleteEvent(selectedEvent.id);
                                            setIsDetailOpen(false);
                                        }}
                                        className="text-sm px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md font-medium transition-colors"
                                    >
                                        Supprimer
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsDetailOpen(false);
                                            setIsFormOpen(true);
                                        }}
                                        className="text-sm px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors"
                                    >
                                        Modifier
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
