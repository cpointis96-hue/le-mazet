"use client";

import { useMemo } from "react";
import { addMonths, format, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { generateMonthGrid, formatDayNumber } from "@/lib/date-utils";
import { CalendarEvent } from "@/types/calendar.types";
import { cn } from "@/lib/utils";

interface YearViewProps {
    currentYear: Date;
    events: CalendarEvent[];
    onMonthClick?: (date: Date) => void;
    onDayClick?: (date: Date) => void;
}

export function YearView({ currentYear, events, onMonthClick, onDayClick }: YearViewProps) {
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
                        <div
                            className="py-2.5 px-3 text-sm font-semibold capitalize border-b border-white/5 text-foreground cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => onMonthClick?.(monthDate)}
                        >
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

                        {/* Days grid — same style as MonthViewDay */}
                        <div className="grid grid-cols-7 auto-rows-[minmax(40px,auto)]">
                            {days.map((date, dayIdx) => {
                                const isCurrentMonth = isSameMonth(date, monthDate);
                                const isCurrentDay = isToday(date);
                                const dStr = format(date, "yyyy-MM-dd");
                                const dayEvents = isCurrentMonth
                                    ? events.filter(e => e.startDate <= dStr && e.endDate >= dStr)
                                    : [];

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
                                        <div className="flex items-center px-0.5">
                                            <span className={cn(
                                                "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shrink-0",
                                                isCurrentDay ? "bg-primary text-primary-foreground" : "text-zinc-400"
                                            )}>
                                                {isCurrentMonth ? formatDayNumber(date) : ""}
                                            </span>
                                        </div>

                                        {dayEvents.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 px-0.5">
                                                {dayEvents.slice(0, 6).map((event, eIdx) => (
                                                    <div
                                                        key={eIdx}
                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: event.color || "#7c6ff7" }}
                                                        title={event.title}
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
