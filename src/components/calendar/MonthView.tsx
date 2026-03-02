"use client";

import { useMemo } from "react";
import { generateMonthGrid, formatDayName } from "@/lib/date-utils";
import { CalendarEvent, UserAvailability, AvailabilityStatus } from "@/types/calendar.types";
import { MonthViewDay } from "./MonthViewDay";
import { format } from "date-fns";

interface MonthViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    availabilities?: UserAvailability[];
    onToggleAvailability?: (date: string, status?: AvailabilityStatus) => void;
    onDayClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

export function MonthView({
    currentDate,
    events,
    availabilities = [],
    onToggleAvailability,
    onDayClick,
    onEventClick,
}: MonthViewProps) {
    const days = useMemo(() => generateMonthGrid(currentDate), [currentDate]);

    // Generate weekday headers from the first 7 days
    const weekDays = days.slice(0, 7).map((d) => formatDayName(d));

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b bg-muted/30">
                {weekDays.map((dayName, idx) => (
                    <div
                        key={idx}
                        className="py-2 text-center text-sm font-semibold capitalize text-muted-foreground"
                    >
                        {dayName}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {days.map((date, idx) => {
                    // Filter events for this day
                    const dStr = format(date, 'yyyy-MM-dd');
                    const dayEvents = events.filter((e) => {
                        return e.startDate <= dStr && e.endDate >= dStr;
                    });

                    const dayAvailability = availabilities.find(a => a.date === dStr);

                    return (
                        <MonthViewDay
                            key={date.toISOString()}
                            date={date}
                            currentMonth={currentDate}
                            events={dayEvents}
                            availability={dayAvailability}
                            onToggleAvailability={onToggleAvailability ? () => onToggleAvailability(dStr, dayAvailability?.status) : undefined}
                            onDayClick={onDayClick}
                            onEventClick={onEventClick}
                        />
                    );
                })}
            </div>
        </div>
    );
}
