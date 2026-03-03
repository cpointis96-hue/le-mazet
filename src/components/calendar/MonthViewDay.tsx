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
                "min-h-[100px] border-b border-r border-white/5 p-1 flex flex-col transition-colors cursor-pointer hover:bg-white/3",
                !isCurrentMonth && "opacity-30",
                isCurrentDay && "bg-primary/5"
            )}
        >
            <div className="flex justify-between items-start px-1 mb-1">
                <span
                    className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                        isCurrentDay
                            ? "bg-primary text-primary-foreground"
                            : "text-zinc-300"
                    )}
                >
                    {formatDayNumber(date)}
                </span>

                {/* Availability dot */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleAvailability?.();
                    }}
                    className={cn(
                        "w-3.5 h-3.5 rounded-full mt-1 shrink-0 transition-colors border focus:outline-none",
                        !availability?.status && "bg-white/10 border-white/10 hover:bg-white/20",
                        availability?.status === 'available' && "bg-emerald-500 border-emerald-600",
                        availability?.status === 'busy' && "bg-red-500 border-red-700"
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
                    <div className="text-[10px] text-zinc-600 font-medium px-1 mt-0.5 hover:text-zinc-400">
                        +{hiddenCount} autres
                    </div>
                )}
            </div>
        </div>
    );
}
