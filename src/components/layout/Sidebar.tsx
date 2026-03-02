"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    CalendarDays,
    Users,
    Settings,
    User,
    X,
    Ticket,
    MessageSquare
} from "lucide-react";
import { MemberLegend } from "@/components/shared-calendar/MemberLegend";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onClose?: () => void;
}

export function Sidebar({ className, onClose, ...props }: SidebarProps) {
    const pathname = usePathname();
    const { users } = useSupabaseUsers();

    const navigation = [
        { name: "Mon Calendrier", href: "/mon-calendrier", icon: CalendarDays },
        { name: "Calendrier Commun", href: "/calendrier-commun", icon: Users },
        { name: "Événements", href: "/evenements", icon: Ticket },
        { name: "Messagerie", href: "/messagerie", icon: MessageSquare }
    ];

    const bottomNavigation = [
        { name: "Profil", href: "/profil", icon: User },
        { name: "Paramètres", href: "/parametres", icon: Settings },
    ];

    return (
        <div className={cn("flex h-full flex-col border-r bg-card text-card-foreground", className)} {...props}>
            <div className="flex h-14 items-center justify-between px-4 border-b">
                <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
                    <CalendarDays className="h-5 w-5" />
                    <span>CalenShare</span>
                </Link>
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* MemberLegend for shared calendar context */}
                {pathname === '/calendrier-commun' && (
                    <div className="mt-8 px-4">
                        <h3 className="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Membres du groupe
                        </h3>
                        <MemberLegend members={users} />
                    </div>
                )}
            </div>

            <div className="border-t p-4">
                <nav className="space-y-1">
                    {bottomNavigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                    {/* Bouton de déconnexion */}
                    <button
                        onClick={async () => {
                            if (onClose) onClose();
                            // Client-side sign out
                            const { createClient } = await import('@/lib/supabase/client');
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = '/';
                        }}
                        className="group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                    >
                        <User className="mr-3 h-5 w-5 flex-shrink-0 transition-colors text-red-500" aria-hidden="true" /> {/* On utilise temporairement User si LogOut n'est pas importé ou on peut juste utiliser LogOut */}
                        Se déconnecter
                    </button>
                </nav>
            </div>
        </div>
    );
}
