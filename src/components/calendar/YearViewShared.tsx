"use client";

import { useMemo } from "react";
import { setMonth, startOfYear, format, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { generateMonthGrid } from "@/lib/date-utils";
import { SharedEventDisplay, UserAvailability } from "@/types/calendar.types";
import { cn } from "@/lib/utils";

interface YearViewSharedProps {
    currentYear: Date;
    sharedEvents: SharedEventDisplay[];
    availabilities?: UserAvailability[];
    onDayClick?: (date: Date) => void;
}

function SharedMonthMini({
    monthDate,
    sharedEvents,
    availabilities,
    onDayClick,
}: {
    monthDate: Date;
    sharedEvents: SharedEventDisplay[];
    availabilities: UserAvailability[];
    onDayClick?: (date: Date) => void;
}) {
    const days = useMemo(() => generateMonthGrid(monthDate), [monthDate]);
    const weekDays = days.slice(0, 7).map(d =>
        format(d, "EEEEE", { locale: fr }).toUpperCase()
    );

    return (
        <div className="flex flex-col bg-card rounded-xl border border-white/5 overflow-hidden">
            <div className="py-2.5 px-3 text-sm font-semibold capitalize border-b border-white/5 text-foreground">
                {format(monthDate, "MMMM yyyy", { locale: fr })}
            </div>
            <div className="p-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                    {weekDays.map((d, i) => (
                        <div key={i} className="text-center text-[9px] font-medium text-zinc-600">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                    {days.map((date, idx) => {
                        const isCurrentMonth = isSameMonth(date, monthDate);
                        const isCurrentDay = isToday(date);
                        const dStr = format(date, "yyyy-MM-dd");
                        const hasEvents = isCurrentMonth && sharedEvents.some(e => e.date === dStr);
                        const hasAvail = isCurrentMonth && availabilities.some(
                            a => a.date === dStr && (a.status === "available" || a.status === "busy")
                        );

                        return (
                            <div
                                key={idx}
                                onClick={() => isCurrentMonth && onDayClick?.(date)}
                                className={cn(
                                    "relative flex flex-col items-center justify-center aspect-square text-[10px] rounded-full transition-colors",
                                    isCurrentMonth && "cursor-pointer hover:bg-white/8",
                                    !isCurrentMonth && "text-transparent pointer-events-none",
                                    isCurrentDay && "bg-primary text-primary-foreground font-bold",
                                    !isCurrentDay && isCurrentMonth && "text-zinc-300",
                                )}
                            >
                                {isCurrentMonth ? format(date, "d") : ""}
                                {/* Dots indicator */}
                                {(hasEvents || hasAvail) && !isCurrentDay && isCurrentMonth && (
                                    <div className="absolute bottom-0.5 flex gap-px justify-center">
                                        {hasEvents && <div className="w-1 h-1 rounded-full bg-primary" />}
                                        {hasAvail && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function YearViewShared({
    currentYear,
    sharedEvents,
    availabilities = [],
    onDayClick,
}: YearViewSharedProps) {
    const months = useMemo(() => {
        const yearStart = startOfYear(currentYear);
        return Array.from({ length: 12 }, (_, i) => setMonth(yearStart, i));
    }, [currentYear]);

    return (
        // All 12 months in a scrollable grid — same design on mobile and desktop
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-6">
            {months.map((monthDate, idx) => {
                const monthStr = format(monthDate, "yyyy-MM");
                return (
                    <SharedMonthMini
                        key={idx}
                        monthDate={monthDate}
                        sharedEvents={sharedEvents.filter(e => e.date.startsWith(monthStr))}
                        availabilities={availabilities.filter(a => a.date.startsWith(monthStr))}
                        onDayClick={onDayClick}
                    />
                );
            })}
        </div>
    );
}
