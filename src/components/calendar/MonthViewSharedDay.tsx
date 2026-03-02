"use client";

import { isSameDay, isSameMonth, format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { SharedEventDisplay, UserAvailability } from "@/types/calendar.types";
import { SharedEventPill } from "../shared-calendar/SharedEventPill";
import { Plus } from "lucide-react";
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

        return (
            <div
                onClick={() => onDayClick?.(date)}
                className={cn(
                    "min-h-[120px] border-b border-r p-2 transition-colors relative group",
                    !isCurrentMonth ? "bg-muted/10 text-muted-foreground/50" : "bg-card hover:bg-muted/20 cursor-pointer",
                    _isToday && "bg-primary/5" // Slight highlight for today
                )}
            >
                {/* Header of the day (Date number et résumé disponibilités) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-1 sm:gap-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                            className={cn(
                                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full shrink-0",
                                _isToday
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : !isCurrentMonth
                                        ? "text-muted-foreground/50"
                                        : "text-foreground"
                            )}
                        >
                            {format(date, "d")}
                        </span>

                        {/* Mini pastilles de résumé */}
                        {availabilities.length > 0 && (
                            <div className="flex -space-x-1 shrink-0 overflow-hidden ml-1">
                                {availabilities.filter(a => a.status === 'available').map((a, i) => (
                                    <div key={`av-${a.userId}-${i}`} className="w-2.5 h-2.5 rounded-full bg-green-500 border border-card ring-1 ring-card" title="Disponible" />
                                ))}
                                {availabilities.filter(a => a.status === 'busy').map((a, i) => (
                                    <div key={`bu-${a.userId}-${i}`} className="w-2.5 h-2.5 rounded-full bg-red-500 border border-card ring-1 ring-card" title="Occupé" />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add button visible on hover */}
                    {isCurrentMonth && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDayClick?.(date);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 shrink-0 text-muted-foreground hover:text-foreground transition-opacity"
                            title="Voir les détails / disponibilités"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Event list */}
                <div className="flex flex-col gap-0.5 max-h-[calc(100%-2rem)] overflow-y-auto hide-scrollbar">
                    {events.map((event, idx) => {
                        // Creating a unique key since SharedEventDisplay might not have an id
                        const eventKey = `${event.userId}-${event.date}-${event.type}-${'title' in event ? event.title : 'occupe'}-${idx}`;
                        return (
                            <div key={eventKey} onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event);
                            }}>
                                <SharedEventPill event={event} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
);
MonthViewSharedDay.displayName = "MonthViewSharedDay";
