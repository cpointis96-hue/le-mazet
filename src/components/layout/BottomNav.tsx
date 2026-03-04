"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, Ticket, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Calendrier", href: "/calendrier", icon: CalendarDays },
    { name: "Événements", href: "/evenements", icon: Ticket },
    { name: "Paramètres", href: "/parametres", icon: Settings },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            {/* Blur backdrop */}
            <div className="absolute inset-0 bg-[#111113]/90 backdrop-blur-xl border-t border-white/5" />

            <div className="relative flex items-stretch h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all duration-200 active:scale-95",
                                isActive
                                    ? "text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200",
                                    isActive ? "bg-white/10" : "bg-transparent"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "w-5 h-5 transition-all duration-200",
                                        isActive ? "stroke-[2px] text-primary" : "stroke-[1.5px]"
                                    )}
                                />
                            </div>
                            <span className={isActive ? "font-semibold text-white" : ""}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
