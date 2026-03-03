import * as React from "react";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { STATIC_USER } from "@/lib/static-data";

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    return (
        <div className="absolute top-4 left-4 z-30 lg:hidden">
            <button
                type="button"
                className="p-1 -ml-1 text-muted-foreground bg-slate-50/80 dark:bg-slate-950/80 rounded-md shadow-sm"
                onClick={onMenuClick}
            >
                <span className="sr-only">Ouvrir le menu</span>
                <Menu className="h-6 w-6 text-foreground" aria-hidden="true" />
            </button>
        </div>
    );
}
