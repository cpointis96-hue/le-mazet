"use client";

import { useState } from "react";
import { CalendarNavigation } from "@/components/calendar/CalendarNavigation";
import { CalendarSwitcher } from "@/components/calendar/CalendarSwitcher";
import { MonthView } from "@/components/calendar/MonthView";
import { YearView } from "@/components/calendar/YearView";
import { format } from "date-fns";
import { useCalendarView } from "@/hooks/useCalendarView";
import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";
import { useAvailabilities } from "@/hooks/useAvailabilities";
import { useProposalsData } from "@/hooks/useProposalsData";
import { CalendarEvent } from "@/types/calendar.types";
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

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsFormOpen(true);
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pl-10 lg:pl-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Mon Calendrier</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Gérez vos événements personnels</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 self-end md:self-auto w-auto">
                    <CalendarNavigation
                        label={navigationLabel}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                    <CalendarSwitcher viewMode={viewMode} onChange={setViewMode} />
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                {viewMode === "mois" ? (
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
