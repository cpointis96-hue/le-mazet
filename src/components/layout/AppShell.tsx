"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar — hidden on mobile, always visible on lg+ */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col">
                <Sidebar className="flex-1" />
            </div>

            {/* Main Content Pane */}
            <div className="flex flex-1 flex-col overflow-hidden relative">
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/50 dark:bg-slate-950/50 pb-20 lg:pb-6">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation — hidden on desktop */}
            <BottomNav />
        </div>
    );
}
