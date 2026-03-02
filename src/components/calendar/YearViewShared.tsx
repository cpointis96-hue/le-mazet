"use client";

import { useState, useMemo, useEffect } from "react";
import { setMonth, startOfYear, format, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { generateMonthGrid } from "@/lib/date-utils";
import { SharedEventDisplay, UserAvailability } from "@/types/calendar.types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
        format(d, 'EEEEE', { locale: fr }).toUpperCase()
    );

    return (
        <div className="flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="py-2 px-3 text-center text-sm font-semibold capitalize border-b bg-muted/20">
                {format(monthDate, 'MMMM yyyy', { locale: fr })}
            </div>
            <div className="p-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                    {weekDays.map((d, i) => (
                        <div key={i} className="text-center text-[9px] font-medium text-muted-foreground">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                    {days.map((date, idx) => {
                        const isCurrentMonth = isSameMonth(date, monthDate);
                        const isCurrentDay = isToday(date);
                        const dStr = format(date, 'yyyy-MM-dd');
                        const hasEvents = isCurrentMonth && sharedEvents.some(e => e.date === dStr);
                        const hasAvail = isCurrentMonth && availabilities.some(
                            a => a.date === dStr && (a.status === 'available' || a.status === 'busy')
                        );

                        return (
                            <div
                                key={idx}
                                onClick={() => isCurrentMonth && onDayClick?.(date)}
                                className={cn(
                                    "relative flex flex-col items-center justify-center aspect-square text-[10px] rounded-full",
                                    isCurrentMonth && "cursor-pointer hover:bg-muted/80 transition-colors",
                                    !isCurrentMonth && "text-transparent pointer-events-none",
                                    isCurrentDay && "bg-primary text-primary-foreground font-bold hover:bg-primary/90",
                                    !isCurrentDay && isCurrentMonth && "text-foreground",
                                )}
                            >
                                {isCurrentMonth ? format(date, 'd') : ''}
                                {/* Dots indicator */}
                                {(hasEvents || hasAvail) && !isCurrentDay && isCurrentMonth && (
                                    <div className="absolute bottom-0.5 flex gap-px justify-center">
                                        {hasEvents && <div className="w-1 h-1 rounded-full bg-primary" />}
                                        {hasAvail && <div className="w-1 h-1 rounded-full bg-green-500" />}
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
    const currentYear4 = currentYear.getFullYear();

    const [mobileMonthIndex, setMobileMonthIndex] = useState(() => {
        const now = new Date();
        return currentYear4 === now.getFullYear() ? now.getMonth() : 0;
    });

    // Reset mobile month index when year changes
    useEffect(() => {
        const now = new Date();
        setMobileMonthIndex(currentYear4 === now.getFullYear() ? now.getMonth() : 0);
    }, [currentYear4]);

    const months = useMemo(() => {
        const yearStart = startOfYear(currentYear);
        return Array.from({ length: 12 }, (_, i) => setMonth(yearStart, i));
    }, [currentYear]);

    return (
        <>
            {/* ── Mobile : un mois à la fois ── */}
            <div className="sm:hidden">
                <div className="flex items-center justify-between mb-3 px-1">
                    <button
                        onClick={() => setMobileMonthIndex(i => Math.max(0, i - 1))}
                        disabled={mobileMonthIndex === 0}
                        className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                        aria-label="Mois précédent"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold capitalize">
                        {format(months[mobileMonthIndex], 'MMMM yyyy', { locale: fr })}
                    </span>
                    <button
                        onClick={() => setMobileMonthIndex(i => Math.min(11, i + 1))}
                        disabled={mobileMonthIndex === 11}
                        className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                        aria-label="Mois suivant"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* On mobile show a full-size month view equivalent */}
                <SharedMonthMini
                    monthDate={months[mobileMonthIndex]}
                    sharedEvents={sharedEvents.filter(e =>
                        e.date.startsWith(format(months[mobileMonthIndex], 'yyyy-MM'))
                    )}
                    availabilities={availabilities.filter(a =>
                        a.date.startsWith(format(months[mobileMonthIndex], 'yyyy-MM'))
                    )}
                    onDayClick={onDayClick}
                />
            </div>

            {/* ── Desktop : grille 12 mois ── */}
            {/*
                On évite h-full pour ne pas couper les mois du bas.
                Le parent doit être overflow-y-auto pour scroller si nécessaire.
            */}
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                {months.map((monthDate, idx) => {
                    const monthStr = format(monthDate, 'yyyy-MM');
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
        </>
    );
}
