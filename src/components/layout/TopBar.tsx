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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6 shadow-sm">
            <button
                type="button"
                className="-m-2 p-2 text-muted-foreground md:hidden"
                onClick={onMenuClick}
            >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex flex-1 justify-end gap-x-4 items-center">
                {/* Removed Créer button and Avatar per user request */}
            </div>
        </header>
    );
}
