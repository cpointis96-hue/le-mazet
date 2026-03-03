"use client";

import { useMemo } from "react";
import { addMonths, format, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { generateMonthGrid, formatDayNumber } from "@/lib/date-utils";
import { SharedEventDisplay, UserAvailability } from "@/types/calendar.types";
import { cn } from "@/lib/utils";

interface YearViewSharedProps {
    currentYear: Date;
    sharedEvents: SharedEventDisplay[];
    availabilities?: UserAvailability[];
    onDayClick?: (date: Date) => void;
}

export function YearViewShared({
    currentYear,
    sharedEvents,
    availabilities = [],
    onDayClick,
}: YearViewSharedProps) {
    // 12 months starting from the current month
    const months = useMemo(
        () => Array.from({ length: 12 }, (_, i) => addMonths(currentYear, i)),
        [currentYear]
    );

    return (
        <div className="flex flex-col gap-4 pb-6">
            {months.map((monthDate, idx) => {
                const days = generateMonthGrid(monthDate);
                const weekDays = days.slice(0, 7).map(d =>
                    format(d, "EEEEE", { locale: fr }).toUpperCase()
                );

                return (
                    <div key={idx} className="bg-card rounded-xl border border-white/5 overflow-hidden">
                        {/* Month name */}
                        <div className="py-2.5 px-3 text-sm font-semibold capitalize border-b border-white/5 text-foreground">
                            {format(monthDate, "MMMM yyyy", { locale: fr })}
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 border-b border-white/5">
                            {weekDays.map((day, i) => (
                                <div key={i} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days grid — same style as MonthViewSharedDay */}
                        <div className="grid grid-cols-7 auto-rows-[minmax(40px,auto)]">
                            {days.map((date, dayIdx) => {
                                const isCurrentMonth = isSameMonth(date, monthDate);
                                const isCurrentDay = isToday(date);
                                const dStr = format(date, "yyyy-MM-dd");

                                const dayEvents = isCurrentMonth
                                    ? sharedEvents.filter(e => e.date === dStr)
                                    : [];
                                const availableCount = isCurrentMonth
                                    ? availabilities.filter(a => a.date === dStr && a.status === "available").length
                                    : 0;
                                const busyCount = isCurrentMonth
                                    ? availabilities.filter(a => a.date === dStr && a.status === "busy").length
                                    : 0;

                                return (
                                    <div
                                        key={dayIdx}
                                        onClick={() => isCurrentMonth && onDayClick?.(date)}
                                        className={cn(
                                            "border-b border-r border-white/5 p-1 flex flex-col gap-0.5 transition-colors",
                                            isCurrentMonth && "cursor-pointer hover:bg-white/3",
                                            !isCurrentMonth && "opacity-25 pointer-events-none",
                                            isCurrentDay && "bg-primary/5"
                                        )}
                                    >
                                        {/* Day number + dispo pastilles */}
                                        <div className="flex justify-between items-center px-0.5">
                                            <span className={cn(
                                                "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shrink-0",
                                                isCurrentDay ? "bg-primary text-primary-foreground" : "text-zinc-400"
                                            )}>
                                                {isCurrentMonth ? formatDayNumber(date) : ""}
                                            </span>

                                            {(availableCount > 0 || busyCount > 0) && (
                                                <div className="flex gap-px shrink-0">
                                                    {availableCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                                    {busyCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                                </div>
                                            )}
                                        </div>

                                        {/* Event dots */}
                                        {dayEvents.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 px-0.5">
                                                {dayEvents.slice(0, 6).map((event, eIdx) => (
                                                    <div
                                                        key={eIdx}
                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: event.color || "#7c6ff7" }}
                                                        title={"title" in event ? (event as any).title : "Occupé"}
                                                    />
                                                ))}
                                                {dayEvents.length > 6 && (
                                                    <span className="text-[8px] text-zinc-600 leading-none self-center">+{dayEvents.length - 6}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
