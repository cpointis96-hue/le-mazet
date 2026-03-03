"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, Ticket, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Calendrier", href: "/mon-calendrier", icon: CalendarDays },
    { name: "Commun", href: "/calendrier-commun", icon: Users },
    { name: "Événements", href: "/evenements", icon: Ticket },
    { name: "Messages", href: "/messagerie", icon: MessageSquare },
    { name: "Profil", href: "/profil", icon: User },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            {/* Blur backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />

            <div className="relative flex items-stretch h-16 safe-area-pb">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all duration-200 active:scale-95",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-primary/15"
                                        : "bg-transparent"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "w-5 h-5 transition-all duration-200",
                                        isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                                    )}
                                />
                            </div>
                            <span className={isActive ? "font-semibold" : ""}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
