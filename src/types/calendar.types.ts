export type ViewMode = 'mois' | 'annee';

export type PrivacyLevel = 'prive' | 'public' | 'public_details';

export interface CalendarEvent {
    id: string;
    userId: string;
    status: 'proposed' | 'confirmed';
    title: string;
    description?: string;
    location?: string;
    startDate: string; // ISO date YYYY-MM-DD
    endDate: string; // ISO string
    startTime?: string | null; // HH:mm
    endTime?: string | null;
    pollDeadline?: string | null;
    allDay: boolean;
    color: string;
    icon?: string;
    category?: string;
    privacy: PrivacyLevel;
    recurrenceRule?: string;
    recurrenceEnd?: string;
    reminderMinutes?: number;
    isMultiDate?: boolean;
}

export interface EventDateProposal {
    id: string;
    eventId: string;
    startDate: string;
    endDate?: string; // pour les propositions vacances (plage de dates)
    startTime?: string;
    comment?: string;
}

export interface EventDateVote {
    id: string;
    proposalId: string;
    userId: string;
    status: 'available' | 'unavailable' | 'maybe';
}

export type SharedEventDisplay =
    | { type: 'occupe'; date: string; color: string; userId: string }
    | { type: 'public'; title: string; date: string; color: string; userId: string }
    | { type: 'public_details'; title: string; description?: string; date: string; color: string; userId: string };

export type AvailabilityStatus = 'available' | 'busy';

export interface UserAvailability {
    id: string;
    userId: string;
    date: string; // ISO YYYY-MM-DD
    status: AvailabilityStatus;
}

export type ChecklistCategory = 'vin_rouge' | 'vin_blanc' | 'dessert' | 'saucisson' | 'charcuterie' | 'fromage' | 'autres';

export interface ChecklistItem {
    id: string;
    eventId: string;
    userId: string;
    category: ChecklistCategory;
    description: string | null;
    createdAt: string;
    user?: {
        displayName: string;
        color?: string;
        avatarId?: string;
    };
}
