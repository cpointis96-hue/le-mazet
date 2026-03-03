"use client";

import { isSameMonth, isToday, format } from "date-fns";
import { cn } from "@/lib/utils";
import { SharedEventDisplay, UserAvailability } from "@/types/calendar.types";
import * as React from "react";

interface MonthViewSharedDayProps {
    date: Date;
    currentMonth: Date;
    events: SharedEventDisplay[];
    availabilities?: UserAvailability[];
    onDayClick?: (date: Date) => void;
    onEventClick?: (event: SharedEventDisplay) => void;
}

export const MonthViewSharedDay = React.memo(
    ({
        date,
        currentMonth,
        events,
        availabilities = [],
        onDayClick,
        onEventClick,
    }: MonthViewSharedDayProps) => {
        const _isToday = isToday(date);
        const isCurrentMonth = isSameMonth(date, currentMonth);

        const availableCount = availabilities.filter(a => a.status === 'available').length;
        const busyCount = availabilities.filter(a => a.status === 'busy').length;

        return (
            <div
                onClick={() => onDayClick?.(date)}
                className={cn(
                    "border-b border-r border-white/5 p-1 flex flex-col gap-0.5 transition-colors cursor-pointer hover:bg-white/3",
                    !isCurrentMonth && "opacity-25",
                    _isToday && "bg-primary/5"
                )}
            >
                {/* Numéro + pastilles dispo */}
                <div className="flex justify-between items-center px-0.5">
                    <span className={cn(
                        "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shrink-0",
                        _isToday ? "bg-primary text-primary-foreground" : "text-zinc-400"
                    )}>
                        {format(date, "d")}
                    </span>

                    {/* Mini pastilles dispo groupées */}
                    {(availableCount > 0 || busyCount > 0) && (
                        <div className="flex gap-px shrink-0">
                            {availableCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            {busyCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        </div>
                    )}
                </div>

                {/* Dots événements — clic bulle vers onDayClick du parent */}
                {events.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 px-0.5">
                        {events.slice(0, 6).map((event, idx) => (
                            <div
                                key={`${event.userId}-${event.date}-${idx}`}
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: event.color || '#7c6ff7' }}
                                title={'title' in event ? event.title : 'Occupé'}
                            />
                        ))}
                        {events.length > 6 && (
                            <span className="text-[8px] text-zinc-600 leading-none self-center">+{events.length - 6}</span>
                        )}
                    </div>
                )}
            </div>
        );
    }
);
MonthViewSharedDay.displayName = "MonthViewSharedDay";
