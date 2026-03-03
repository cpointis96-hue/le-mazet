import { CalendarEvent } from "@/types/calendar.types";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";

interface MonthViewEventProps {
    event: CalendarEvent;
    onClick?: (event: CalendarEvent) => void;
}

export function MonthViewEvent({ event, onClick }: MonthViewEventProps) {
    // If it's a shared calendar, privacy logic comes from SharedEventPill
    // Here we just render the raw event as if it's "Mon Calendrier" (personal view)
    // For Phase 1, we just render the basic pill

    return (
        <Tooltip.Provider delayDuration={300}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(event);
                        }}
                        className={cn(
                            "px-1.5 py-0.5 rounded-sm text-xs font-medium truncate cursor-pointer transition-opacity hover:opacity-80 mb-0.5 text-white shadow-sm flex items-center justify-between",
                            event.allDay ? "" : "bg-opacity-90"
                        )}
                        style={{ backgroundColor: event.color }}
                    >
                        <span className="truncate">{event.title}</span>
                        {!event.allDay && event.startTime && (
                            <span className="ml-1 text-[10px] opacity-90 shrink-0">
                                {event.startTime.slice(0, 5)}
                            </span>
                        )}
                    </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                        sideOffset={4}
                    >
                        <p className="font-semibold">{event.title}</p>
                        {event.description && <p className="text-xs mt-1 text-muted-foreground">{event.description}</p>}
                        <Tooltip.Arrow className="fill-border" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}
