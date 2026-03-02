"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CalendarNavigationProps {
    label: string;
    onPrev: () => void;
    onNext: () => void;
}

export function CalendarNavigation({
    label,
    onPrev,
    onNext,
}: CalendarNavigationProps) {
    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrev} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Précédent</span>
            </Button>
            <h2 className="text-xl font-semibold capitalize min-w-[140px] text-center">{label}</h2>
            <Button variant="outline" size="icon" onClick={onNext} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Suivant</span>
            </Button>
        </div>
    );
}
