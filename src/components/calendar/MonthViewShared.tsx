"use client";

import { useMemo } from "react";
import { generateMonthGrid, formatDayName } from "@/lib/date-utils";
import { SharedEventDisplay, UserAvailability } from "@/types/calendar.types";
import { MonthViewSharedDay } from "./MonthViewSharedDay";
import { format } from "date-fns";

interface MonthViewSharedProps {
    currentDate: Date;
    events: SharedEventDisplay[];
    availabilities?: UserAvailability[];
    onDayClick?: (date: Date) => void;
    onEventClick?: (event: SharedEventDisplay) => void;
}

export function MonthViewShared({
    currentDate,
    events,
    availabilities = [],
    onDayClick,
    onEventClick,
}: MonthViewSharedProps) {
    const days = useMemo(() => generateMonthGrid(currentDate), [currentDate]);

    // Generate weekday headers from the first 7 days
    const weekDays = days.slice(0, 7).map((d) => formatDayName(d));

    return (
        <div className="flex flex-col bg-card rounded-xl border border-white/5 overflow-hidden">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b border-white/5">
                {weekDays.map((dayName, idx) => (
                    <div
                        key={idx}
                        className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-600"
                    >
                        {dayName}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div>
                <div className="grid grid-cols-7 auto-rows-[minmax(40px,auto)]">
                    {days.map((date) => {
                        // Filter SharedEventDisplay for this day
                        const dStr = format(date, 'yyyy-MM-dd');
                        const dayEvents = events.filter((e) => e.date <= dStr && e.endDate >= dStr);
                        const dayAvailabilities = availabilities.filter(a => a.date === dStr);

                        return (
                            <MonthViewSharedDay
                                key={date.toISOString()}
                                date={date}
                                currentMonth={currentDate}
                                events={dayEvents}
                                availabilities={dayAvailabilities}
                                onDayClick={onDayClick}
                                onEventClick={onEventClick}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
