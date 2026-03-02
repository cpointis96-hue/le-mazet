import { SupabaseClient } from '@supabase/supabase-js';

export interface EventResponse {
    id: string;
    eventId: string;
    userId: string;
    status: 'available' | 'unavailable';
    createdAt: string;
}

export interface EventComment {
    id: string;
    eventId: string;
    userId: string;
    content: string;
    createdAt: string;
}

// RESPONSES
export async function getEventResponses(supabase: SupabaseClient): Promise<EventResponse[]> {
    const { data, error } = await supabase.from('event_responses').select('*');
    if (error) {
        console.error('getEventResponses error:', error);
        return [];
    }
    return (data || []).map(row => ({
        id: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        status: row.status,
        createdAt: row.created_at,
    }));
}

export async function upsertEventResponse(
    supabase: SupabaseClient,
    eventId: string,
    userId: string,
    status: 'available' | 'unavailable'
): Promise<EventResponse | null> {
    const { data, error } = await supabase
        .from('event_responses')
        .upsert({
            event_id: eventId,
            user_id: userId,
            status: status
        }, { onConflict: 'event_id,user_id' })
        .select()
        .single();

    if (error) {
        console.error('upsertEventResponse error:', error);
        return null;
    }

    return {
        id: data.id,
        eventId: data.event_id,
        userId: data.user_id,
        status: data.status,
        createdAt: data.created_at
    };
}

export async function deleteEventResponse(
    supabase: SupabaseClient,
    eventId: string,
    userId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('event_responses')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

    if (error) {
        console.error('deleteEventResponse error:', error);
        return false;
    }
    return true;
}

// COMMENTS
export async function getEventComments(supabase: SupabaseClient): Promise<EventComment[]> {
    const { data, error } = await supabase.from('event_comments').select('*').order('created_at', { ascending: true });
    if (error) {
        console.error('getEventComments error:', error);
        return [];
    }
    return (data || []).map(row => ({
        id: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        content: row.content,
        createdAt: row.created_at,
    }));
}

export async function addEventComment(
    supabase: SupabaseClient,
    eventId: string,
    userId: string,
    content: string
): Promise<EventComment | null> {
    const { data, error } = await supabase
        .from('event_comments')
        .insert({
            event_id: eventId,
            user_id: userId,
            content: content
        })
        .select()
        .single();

    if (error) {
        console.error('addEventComment error:', error);
        return null;
    }

    return {
        id: data.id,
        eventId: data.event_id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at
    };
}
