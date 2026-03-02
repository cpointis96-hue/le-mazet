import { CalendarEvent, UserAvailability } from "@/types/calendar.types";
import { isSameDay, isSameMonth, isToday } from "date-fns";
import { formatDayNumber } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { MonthViewEvent } from "./MonthViewEvent";

interface MonthViewDayProps {
    date: Date;
    currentMonth: Date;
    events: CalendarEvent[];
    availability?: UserAvailability;
    onToggleAvailability?: () => void;
    onDayClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

export function MonthViewDay({
    date,
    currentMonth,
    events,
    availability,
    onToggleAvailability,
    onDayClick,
    onEventClick,
}: MonthViewDayProps) {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isCurrentDay = isToday(date);

    // Sort events (all-day first, then by time)
    const sortedEvents = [...events].sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        return 0;
    });

    const displayLimit = 3;
    const visibleEvents = sortedEvents.slice(0, displayLimit);
    const hiddenCount = sortedEvents.length - displayLimit;

    return (
        <div
            onClick={() => onDayClick?.(date)}
            className={cn(
                "min-h-[100px] border-b border-r p-1 flex flex-col transition-colors cursor-pointer hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isCurrentDay && "bg-primary/5"
            )}
        >
            <div className="flex justify-between items-start px-1 mb-1">
                <span
                    className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                        isCurrentDay
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                    )}
                >
                    {formatDayNumber(date)}
                </span>

                {/* Pastille de disponibilité (Vert/Rouge) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleAvailability?.();
                    }}
                    className={cn(
                        "w-4 h-4 rounded-full mt-1 shrink-0 transition-colors border shadow-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary",
                        !availability?.status && "bg-muted border-border hover:bg-muted-foreground/30",
                        availability?.status === 'available' && "bg-green-500 border-green-600 shadow-green-500/20",
                        availability?.status === 'busy' && "bg-red-500 border-red-600 shadow-red-500/20"
                    )}
                    title={
                        availability?.status === 'available' ? "Disponible" :
                            availability?.status === 'busy' ? "Occupé" :
                                "Définir la disponibilité"
                    }
                />
            </div>

            <div className="flex-1 flex flex-col gap-px overflow-y-auto">
                {visibleEvents.map((event) => (
                    <MonthViewEvent
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                    />
                ))}

                {hiddenCount > 0 && (
                    <div className="text-xs text-muted-foreground font-medium px-1 mt-0.5 hover:text-foreground">
                        +{hiddenCount} autres
                    </div>
                )}
            </div>
        </div>
    );
}
