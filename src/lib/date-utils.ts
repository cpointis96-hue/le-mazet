import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export function generateMonthGrid(date: Date) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
}

export function formatMonthYear(date: Date) {
    return format(date, 'MMMM yyyy', { locale: fr });
}

export function formatDayName(date: Date) {
    return format(date, 'EEEE', { locale: fr });
}

export function formatShortDayName(date: Date) {
    return format(date, 'EEE', { locale: fr });
}

export function formatDayNumber(date: Date) {
    return format(date, 'd');
}

export function formatISO(date: Date) {
    return format(date, 'yyyy-MM-dd');
}
