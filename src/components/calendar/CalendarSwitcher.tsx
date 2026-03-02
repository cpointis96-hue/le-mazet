"use client";

import { ViewMode } from "@/types/calendar.types";

interface CalendarSwitcherProps {
    viewMode: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export function CalendarSwitcher({ viewMode, onChange }: CalendarSwitcherProps) {
    return (
        <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-border bg-muted/50 p-1">
            <button
                onClick={() => onChange("mois")}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${viewMode === "mois"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                Mois
            </button>
            <button
                onClick={() => onChange("annee")}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${viewMode === "annee"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                Année
            </button>
        </div>
    );
}
