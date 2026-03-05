'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseEvents } from '@/hooks/useSupabaseEvents';
import { useSupabaseUsers } from '@/hooks/useSupabaseUsers';
import { useAvailabilities } from '@/hooks/useAvailabilities';
import { useProposalsData } from '@/hooks/useProposalsData';

type ProposalsData = ReturnType<typeof useProposalsData>;
type EventsData = ReturnType<typeof useSupabaseEvents>;
type UsersData = ReturnType<typeof useSupabaseUsers>;
type AvailabilitiesData = ReturnType<typeof useAvailabilities>;

interface AppDataContextValue {
    proposalsData: ProposalsData;
    eventsData: EventsData;
    usersData: UsersData;
    availabilitiesData: AvailabilitiesData;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
    const proposalsData = useProposalsData();
    const eventsData = useSupabaseEvents(proposalsData.responses);
    const usersData = useSupabaseUsers();
    const availabilitiesData = useAvailabilities();

    return (
        <AppDataContext.Provider value={{ proposalsData, eventsData, usersData, availabilitiesData }}>
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const ctx = useContext(AppDataContext);
    if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
    return ctx;
}
