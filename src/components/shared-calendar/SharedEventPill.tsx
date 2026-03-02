import { SharedEventDisplay } from "@/types/calendar.types";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Icons from "lucide-react";
import { OccupeChip } from "./OccupeChip";

interface SharedEventPillProps {
    event: SharedEventDisplay;
    onClick?: () => void;
}

export function SharedEventPill({ event, onClick }: SharedEventPillProps) {
    if (event.type === 'occupe') {
        return <OccupeChip date={event.date} color={event.color} />;
    }

    const pillContent = (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            className="px-1.5 py-0.5 rounded-sm text-xs font-medium truncate cursor-pointer transition-opacity hover:opacity-80 mb-0.5 shadow-sm flex items-center justify-between gap-1 text-white border-transparent"
            style={{ backgroundColor: event.color || '#3b82f6' }}
        >
            <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="truncate">{event.title}</span>
            </div>
        </div>
    );

    if (event.type === 'public_details') {
        return (
            <Tooltip.Provider delayDuration={300}>
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                        {pillContent}
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

    // Just public, no tooltip details
    return pillContent;
}
