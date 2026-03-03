import { CalendarEvent, UserAvailability } from "@/types/calendar.types";
import { isSameMonth, isToday } from "date-fns";
import { formatDayNumber } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

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

    return (
        <div
            onClick={() => onDayClick?.(date)}
            className={cn(
                "border-b border-r border-white/5 p-1 flex flex-col gap-0.5 transition-colors cursor-pointer hover:bg-white/3",
                !isCurrentMonth && "opacity-25",
                isCurrentDay && "bg-primary/5"
            )}
        >
            {/* Numéro + pastille dispo */}
            <div className="flex justify-between items-center px-0.5">
                <span className={cn(
                    "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shrink-0",
                    isCurrentDay ? "bg-primary text-primary-foreground" : "text-zinc-400"
                )}>
                    {formatDayNumber(date)}
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleAvailability?.();
                    }}
                    className={cn(
                        "w-2 h-2 rounded-full transition-colors focus:outline-none shrink-0",
                        !availability?.status && "bg-white/10 hover:bg-white/25",
                        availability?.status === 'available' && "bg-emerald-500",
                        availability?.status === 'busy' && "bg-red-500"
                    )}
                    title={
                        availability?.status === 'available' ? "Disponible" :
                        availability?.status === 'busy' ? "Occupé" :
                        "Définir la disponibilité"
                    }
                />
            </div>

            {/* Dots événements — clic bulle vers onDayClick du parent */}
            {events.length > 0 && (
                <div className="flex flex-wrap gap-0.5 px-0.5">
                    {events.slice(0, 6).map(event => (
                        <div
                            key={event.id}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: event.color || '#7c6ff7' }}
                            title={event.title}
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
