"use client";

import { useMemo } from "react";
import { generateMonthGrid, formatMonthYear, formatShortDayName, formatDayNumber } from "@/lib/date-utils";
import { CalendarEvent } from "@/types/calendar.types";
import { isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface YearViewMonthProps {
    monthDate: Date;
    events: CalendarEvent[];
    onMonthClick?: (date: Date) => void;
    onDayClick?: (date: Date) => void;
}

export function YearViewMonth({
    monthDate,
    events,
    onMonthClick,
    onDayClick,
}: YearViewMonthProps) {
    const days = useMemo(() => generateMonthGrid(monthDate), [monthDate]);

    // Extract just the day initials (L, M, M, J, V, S, D)
    const weekDays = days.slice(0, 7).map((d) => formatShortDayName(d).charAt(0));

    return (
        <div className="flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden h-full">
            <div
                className="py-2 text-center text-sm font-semibold capitalize border-b cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onMonthClick?.(monthDate)}
            >
                {formatMonthYear(monthDate)}
            </div>

            <div className="p-2 flex-1 flex flex-col">
                {/* Header Row */}
                <div className="grid grid-cols-7 mb-1">
                    {weekDays.map((day, idx) => (
                        <div key={idx} className="text-center text-[10px] font-medium text-muted-foreground uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-1 gap-x-1 flex-1 content-start">
                    {days.map((date, idx) => {
                        const isCurrentMonth = isSameMonth(date, monthDate);
                        const isCurrentDay = isToday(date);
                        const dStr = date.toISOString().split('T')[0];
                        const hasEvents = events.some(e => e.startDate <= dStr && e.endDate >= dStr);

                        return (
                            <div
                                key={idx}
                                onClick={() => onDayClick?.(date)}
                                className={cn(
                                    "flex items-center justify-center rounded-full aspect-square text-xs cursor-pointer hover:bg-muted/80 transition-colors relative",
                                    !isCurrentMonth && "text-muted-foreground/40",
                                    isCurrentMonth && "text-foreground",
                                    isCurrentDay && "bg-primary text-primary-foreground font-medium hover:bg-primary/90",
                                    hasEvents && isCurrentMonth && !isCurrentDay && "font-bold text-primary" // Highlight days with events
                                )}
                            >
                                {formatDayNumber(date)}
                                {hasEvents && !isCurrentDay && isCurrentMonth && (
                                    <div className="absolute bottom-0 w-1 h-1 bg-primary rounded-full translate-y-0.5" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
