import { CalendarEvent } from '@/types/calendar.types';

export const STATIC_USER = {
    id: 'user-1',
    displayName: 'Alice',
    color: '#6366f1'
};

export const STATIC_MEMBERS = [
    { id: 'user-1', displayName: 'Alice', color: '#6366f1' },
    { id: 'user-2', displayName: 'Bob', color: '#f59e0b' },
    { id: 'user-3', displayName: 'Claire', color: '#10b981' },
];

export const STATIC_EVENTS: CalendarEvent[] = [
    {
        id: 'e1', userId: 'user-1', title: 'Réunion équipe', startDate: '2026-03-05',
        endDate: '2026-03-05', startTime: '10:00', endTime: '11:30', allDay: false,
        color: '#6366f1', privacy: 'public', category: 'Travail', status: 'confirmed'
    },
    {
        id: 'e2', userId: 'user-1', title: 'Rendez-vous médecin', startDate: '2026-03-12',
        endDate: '2026-03-12', startTime: '14:00', endTime: '15:00', allDay: false,
        color: '#ef4444', privacy: 'prive', category: 'Santé', status: 'confirmed'
    },
    {
        id: 'e3', userId: 'user-2', title: 'Anniversaire de Bob', startDate: '2026-03-20',
        endDate: '2026-03-20', allDay: true, color: '#f59e0b',
        privacy: 'public_details', description: 'Fête à partir de 18h chez moi !', status: 'confirmed'
    },
];
