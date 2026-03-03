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

    return Object.entries(groups).map(([date, evts]) => ({
        label: getDateLabel(date),
        sublabel: format(parseISO(date), "d MMMM yyyy", { locale: fr }),
        events: evts,
    }));
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
    // Only show upcoming events (today and future)
    const today = format(new Date(), "yyyy-MM-dd");
    const upcomingEvents = events.filter(e => e.endDate >= today);
    const groups = groupEventsByDate(upcomingEvents);

    if (groups.length === 0) {
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
        <div className="flex flex-col gap-6 pb-4">
            {groups.map((group) => (
                <div key={group.label} className="flex flex-col gap-2">
                    {/* Date header */}
                    <div className="flex items-baseline gap-2 px-1">
                        <span className="text-sm font-bold capitalize text-foreground">
                            {group.label}
                        </span>
                        {group.sublabel && group.label !== group.sublabel && (
                            <span className="text-xs text-muted-foreground">
                                {group.sublabel}
                            </span>
                        )}
                    </div>

                    {/* Events for this date */}
                    <div className="flex flex-col gap-2">
                        {group.events.map((event) => (
                            <button
                                key={event.id}
                                onClick={() => onEventClick?.(event)}
                                className={cn(
                                    "w-full flex items-start gap-3 p-3.5 rounded-xl border bg-card text-left transition-all active:scale-[0.98] hover:shadow-sm",
                                    event.status === "proposed"
                                        ? "border-amber-200 dark:border-amber-800/50"
                                        : "border-border"
                                )}
                            >
                                {/* Color indicator */}
                                <div
                                    className="w-1 self-stretch rounded-full shrink-0 mt-1"
                                    style={{ backgroundColor: event.color || "#6366f1" }}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm truncate">
                                            {event.privacy === "prive" ? "Occupé" : event.title}
                                        </p>
                                        {event.status === "proposed" && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wide shrink-0">
                                                Proposition
                                            </span>
                                        )}
                                    </div>

                                    {!event.allDay && event.startTime && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span>
                                                {event.startTime.slice(0, 5)}
                                                {event.endTime && ` → ${event.endTime.slice(0, 5)}`}
                                            </span>
                                        </div>
                                    )}

                                    {event.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
