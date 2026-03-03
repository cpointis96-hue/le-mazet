"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    CalendarDays,
    Users,
    Settings,
    Ticket,
    LogOut,
} from "lucide-react";
import { MemberLegend } from "@/components/shared-calendar/MemberLegend";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onClose?: () => void;
}

const mainNav = [
    { name: "Mon Calendrier", href: "/mon-calendrier", icon: CalendarDays },
    { name: "Calendrier Commun", href: "/calendrier-commun", icon: Users },
    { name: "Événements", href: "/evenements", icon: Ticket },
];

const bottomNav = [
    { name: "Paramètres", href: "/parametres", icon: Settings },
];

function NavItem({
    href,
    icon: Icon,
    name,
    isActive,
    onClick,
}: {
    href: string;
    icon: React.ElementType;
    name: string;
    isActive: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                    ? "bg-white/8 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            )}
        >
            <Icon
                className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                )}
            />
            {name}
            {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}
        </Link>
    );
}

export function Sidebar({ className, onClose, ...props }: SidebarProps) {
    const pathname = usePathname();
    const { users } = useSupabaseUsers();

    return (
        <div
            className={cn(
                "flex h-full flex-col bg-[#111113] border-r border-white/5",
                className
            )}
            {...props}
        >
            {/* Logo */}
            <div className="flex h-14 items-center px-4 border-b border-white/5">
                <Link
                    href="/"
                    className="flex items-center gap-2 group"
                    onClick={onClose}
                >
                    <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-sm text-white tracking-tight">
                        CalenShare
                    </span>
                </Link>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">

                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-2.5 mb-1">
                    Navigation
                </p>

                {mainNav.map((item) => (
                    <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        name={item.name}
                        isActive={pathname === item.href}
                        onClick={onClose}
                    />
                ))}

                {/* Member legend — only on shared calendar page */}
                {pathname === "/calendrier-commun" && users.length > 0 && (
                    <div className="mt-6">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-2.5 mb-2">
                            Membres
                        </p>
                        <div className="px-1">
                            <MemberLegend members={users} />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom nav */}
            <div className="border-t border-white/5 py-3 px-2 flex flex-col gap-1">
                {bottomNav.map((item) => (
                    <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        name={item.name}
                        isActive={pathname === item.href}
                        onClick={onClose}
                    />
                ))}
                <button
                    onClick={async () => {
                        if (onClose) onClose();
                        const { createClient } = await import("@/lib/supabase/client");
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = "/";
                    }}
                    className="group flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-red-500/70 hover:bg-red-500/10 hover:text-red-400"
                >
                    <LogOut className="w-4 h-4 shrink-0 text-red-500/50 group-hover:text-red-400 transition-colors" />
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}
