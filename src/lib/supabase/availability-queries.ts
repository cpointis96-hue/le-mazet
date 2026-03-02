import { SupabaseClient } from '@supabase/supabase-js';
import { UserAvailability, AvailabilityStatus } from '@/types/calendar.types';

export async function getAvailabilities(supabase: SupabaseClient): Promise<UserAvailability[]> {
    const { data, error } = await supabase
        .from('user_availability')
        .select('*')
        // On récupère tout, le RLS filtre si besoin, mais ici RLS = public en lecture
        .order('date', { ascending: true });

    if (error) {
        console.error('getAvailabilities error:', error.message);
        return [];
    }

    // Mapping snake_case to camelCase
    return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        status: row.status as AvailabilityStatus,
    }));
}

export async function upsertAvailability(
    supabase: SupabaseClient,
    userId: string,
    date: string,
    status: AvailabilityStatus
): Promise<UserAvailability | null> {
    const { data, error } = await supabase
        .from('user_availability')
        .upsert(
            {
                user_id: userId,
                date: date,
                status: status,
            },
            { onConflict: 'user_id,date' }
        )
        .select()
        .single();

    if (error) {
        console.error('upsertAvailability error:', error.message);
        return null;
    }

    return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        status: data.status as AvailabilityStatus,
    };
}

export async function deleteAvailability(
    supabase: SupabaseClient,
    userId: string,
    date: string
): Promise<boolean> {
    const { error } = await supabase
        .from('user_availability')
        .delete()
        .eq('user_id', userId)
        .eq('date', date);

    if (error) {
        console.error('deleteAvailability error:', error.message);
        return false;
    }

    return true;
}
