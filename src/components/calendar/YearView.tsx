"use client";

import { useMemo } from "react";
import { setMonth, startOfYear } from "date-fns";
import { CalendarEvent } from "@/types/calendar.types";
import { YearViewMonth } from "./YearViewMonth";

interface YearViewProps {
    currentYear: Date;
    events: CalendarEvent[];
    onMonthClick?: (date: Date) => void;
    onDayClick?: (date: Date) => void;
}

export function YearView({
    currentYear,
    events,
    onMonthClick,
    onDayClick,
}: YearViewProps) {
    const months = useMemo(() => {
        const yearStart = startOfYear(currentYear);
        return Array.from({ length: 12 }, (_, i) => setMonth(yearStart, i));
    }, [currentYear]);

    return (
        // Vertical scroll — 12 months stacked, 2 per row on larger screens
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-6">
            {months.map((monthDate, idx) => {
                const monthStart = monthDate.toISOString().substring(0, 7);
                const monthEvents = events.filter(e =>
                    e.startDate.startsWith(monthStart) || e.endDate.startsWith(monthStart)
                );

                return (
                    <YearViewMonth
                        key={idx}
                        monthDate={monthDate}
                        events={monthEvents}
                        onMonthClick={onMonthClick}
                        onDayClick={onDayClick}
                    />
                );
            })}
        </div>
    );
}
