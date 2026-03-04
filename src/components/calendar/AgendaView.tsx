"use client";

import { CalendarEvent } from "@/types/calendar.types";
import { format, isToday, isTomorrow, isThisWeek, isPast, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock } from "lucide-react";

interface AgendaViewProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

type GroupedEvents = {
    label: string;
    sublabel?: string;
    events: CalendarEvent[];
};

function getDateLabel(dateStr: string): string {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    if (isThisWeek(date)) return format(date, "EEEE", { locale: fr });
    return format(date, "EEEE d MMMM", { locale: fr });
}

function groupEventsByDate(events: CalendarEvent[]): GroupedEvents[] {
    const sorted = [...events].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
    );

    const groups: { [key: string]: CalendarEvent[] } = {};
    for (const event of sorted) {
        if (!groups[event.startDate]) {
            groups[event.startDate] = [];
        }
        groups[event.startDate].push(event);
    }

    return Object.entries(groups).map(([date, evts]) => {
        const fullDateStr = format(parseISO(date), "d MMMM yyyy", { locale: fr });
        const labelStr = getDateLabel(date);

        // Si le label est "Aujourd'hui" ou "Demain" ou juste le jour de la semaine (isThisWeek), 
        // on garde le sublabel (ex: 18 mars 2026).
        // Sinon (ex: "Mercredi 18 mars"), on ne met pas de sublabel car c'est redondant.
        const isLiteral = labelStr === "Aujourd'hui" || labelStr === "Demain" || labelStr.split(' ').length === 1;

        return {
            label: labelStr,
            sublabel: isLiteral ? fullDateStr : undefined,
            events: evts,
        };
    });
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
    // Only show upcoming events (today and future)
    const today = format(new Date(), "yyyy-MM-dd");
    const upcomingEvents = events.filter(e => e.endDate >= today);
    const sortedEvents = [...upcomingEvents].sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (sortedEvents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                    <CalendarDays className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">Rien à l'horizon</p>
                <p className="text-sm text-muted-foreground/70">Ajoute un événement pour commencer !</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 pb-4">
            {sortedEvents.map((event) => {
                const dateLabel = format(parseISO(event.startDate), "d MMMM yyyy", { locale: fr });

                return (
                    <button
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className={cn(
                            "w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-card text-left transition-all active:scale-[0.98] hover:shadow-sm",
                            event.status === "proposed"
                                ? "border-amber-200 dark:border-amber-800/50"
                                : "border-border"
                        )}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Color indicator */}
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: event.color || "#6366f1" }}
                            />
                            <p className="font-semibold text-sm truncate">
                                {event.privacy === "prive" ? "Occupé" : event.title}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-medium text-foreground/80 lowercase whitespace-nowrap">
                                {dateLabel}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
