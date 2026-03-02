import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Icons from "lucide-react";

interface OccupeChipProps {
    date: string;
    color: string;
}

export function OccupeChip({ date, color }: OccupeChipProps) {
    const hexColor = color?.startsWith('#') ? color : '#94a3b8';

    return (
        <div
            className="px-1.5 py-0.5 rounded-sm text-[10px] font-medium truncate mb-0.5 shadow-sm opacity-80 backdrop-blur-sm flex items-center justify-center gap-1"
            style={{ backgroundColor: `${hexColor}15`, borderColor: hexColor, color: hexColor, borderWidth: '1px', borderStyle: 'dashed' }}
        >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hexColor }} />
            <span>Occupé</span>
        </div>
    );
}
