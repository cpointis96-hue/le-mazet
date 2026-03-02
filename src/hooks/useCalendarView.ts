import { useState, useCallback } from "react";
import { addMonths, subMonths, addYears, subYears } from "date-fns";
import { ViewMode } from "@/types/calendar.types";
import { formatMonthYear } from "@/lib/date-utils";

export function useCalendarView(initialMode: ViewMode = "mois") {
    const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    const handlePrev = useCallback(() => {
        setCurrentDate((prev) =>
            viewMode === "mois" ? subMonths(prev, 1) : subYears(prev, 1)
        );
    }, [viewMode]);

    const handleNext = useCallback(() => {
        setCurrentDate((prev) =>
            viewMode === "mois" ? addMonths(prev, 1) : addYears(prev, 1)
        );
    }, [viewMode]);

    const navigationLabel =
        viewMode === "mois"
            ? formatMonthYear(currentDate)
            : currentDate.getFullYear().toString();

    return {
        viewMode,
        setViewMode,
        currentDate,
        setCurrentDate,
        handlePrev,
        handleNext,
        navigationLabel
    };
}
