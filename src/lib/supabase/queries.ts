import { CalendarEvent, ChecklistItem, ChecklistCategory, EventDateProposal, EventDateVote } from '@/types/calendar.types';
import { SupabaseClient } from '@supabase/supabase-js';

// Helper : convertit une ligne BDD → CalendarEvent
function rowToEvent(row: Record<string, unknown>): CalendarEvent {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        status: (row.status as 'proposed' | 'confirmed') || 'confirmed',
        title: row.title as string,
        description: row.description as string | undefined,
        location: row.location as string | undefined,
        startDate: row.start_date as string,
        endDate: row.end_date as string,
        startTime: row.start_time as string | undefined,
        endTime: row.end_time as string | undefined,
        allDay: row.all_day as boolean,
        color: row.color as string,
        icon: row.icon as string | undefined,
        category: row.category as string | undefined,
        privacy: row.privacy as CalendarEvent['privacy'],
        recurrenceRule: row.recurrence_rule as string | undefined,
        recurrenceEnd: row.recurrence_end as string | undefined,
        reminderMinutes: row.reminder_minutes as number | undefined,
        isMultiDate: row.is_multi_date as boolean | undefined,
    };
}

// Helper : convertit un CalendarEvent → payload BDD
function eventToRow(event: Omit<CalendarEvent, 'id' | 'userId'>, userId: string) {
    return {
        user_id: userId,
        status: event.status || 'confirmed',
        title: event.title,
        description: event.description ?? null,
        location: event.location ?? null,
        start_date: event.startDate,
        end_date: event.endDate,
        start_time: event.startTime ?? null,
        end_time: event.endTime ?? null,
        all_day: event.allDay,
        color: event.color,
        icon: event.icon ?? null,
        category: event.category ?? null,
        privacy: event.privacy,
        recurrence_rule: event.recurrenceRule ?? null,
        recurrence_end: event.recurrenceEnd ?? null,
        reminder_minutes: event.reminderMinutes ?? null,
        is_multi_date: event.isMultiDate ?? false,
    };
}

// Utilise la fonction RPC get_calendar_events() qui masque les champs sensibles
// des événements privés des autres utilisateurs (titre, description, lieu = NULL).
export async function getEvents(supabase: SupabaseClient): Promise<CalendarEvent[]> {
    const { data, error } = await supabase.rpc('get_calendar_events');

    if (error) {
        console.error('getEvents error:', error.message);
        return [];
    }

    return (data ?? []).map(rowToEvent);
}

export async function createEvent(
    supabase: SupabaseClient,
    event: Omit<CalendarEvent, 'id' | 'userId'>,
    userId: string
): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
        .from('events')
        .insert(eventToRow(event, userId))
        .select()
        .single();

    if (error) {
        console.error('createEvent error:', error.message);
        return null;
    }

    return rowToEvent(data);
}

export async function createDateProposals(
    supabase: SupabaseClient,
    eventId: string,
    proposals: Omit<EventDateProposal, 'id' | 'eventId'>[]
): Promise<boolean> {
    const rows = proposals.map(p => ({
        event_id: eventId,
        start_date: p.startDate,
        start_time: p.startTime || null,
        comment: p.comment || null
    }));

    const { error } = await supabase.from('event_date_proposals').insert(rows);

    if (error) {
        console.error('createDateProposals error:', error.message);
        return false;
    }
    return true;
}

export async function getEventDateProposals(
    supabase: SupabaseClient,
    eventId: string
): Promise<EventDateProposal[]> {
    const { data, error } = await supabase
        .from('event_date_proposals')
        .select('*')
        .eq('event_id', eventId)
        .order('start_date', { ascending: true });

    if (error) {
        console.error('getEventDateProposals error:', error.message);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        eventId: row.event_id,
        startDate: row.start_date,
        startTime: row.start_time,
        comment: row.comment
    }));
}

export async function getEventDateVotes(
    supabase: SupabaseClient,
    eventId: string
): Promise<(EventDateVote & { user: { displayName: string, avatarId: string | null } })[]> {
    const { data, error } = await supabase
        .from('event_date_votes')
        .select(`
            *,
            proposal:proposal_id!inner(event_id),
            user:user_id(display_name, avatar_id)
        `)
        .eq('proposal.event_id', eventId);

    if (error) {
        console.error('getEventDateVotes error:', error.message);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        proposalId: row.proposal_id,
        userId: row.user_id,
        status: row.status,
        user: {
            displayName: row.user?.display_name || 'Inconnu',
            avatarId: row.user?.avatar_id || null
        }
    }));
}

export async function voteForDateProposal(
    supabase: SupabaseClient,
    proposalId: string,
    userId: string,
    status: 'available' | 'unavailable' | 'maybe'
): Promise<boolean> {
    const { error } = await supabase
        .from('event_date_votes')
        .upsert({
            proposal_id: proposalId,
            user_id: userId,
            status: status
        }, { onConflict: 'proposal_id,user_id' });

    if (error) {
        console.error('voteForDateProposal error:', error.message);
        return false;
    }
    return true;
}

export async function deleteDateVote(
    supabase: SupabaseClient,
    proposalId: string,
    userId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('event_date_votes')
        .delete()
        .eq('proposal_id', proposalId)
        .eq('user_id', userId);

    if (error) {
        console.error('deleteDateVote error:', error.message);
        return false;
    }
    return true;
}

export async function confirmWinningDate(
    supabase: SupabaseClient,
    eventId: string,
    winningProposalId: string
): Promise<boolean> {
    const { data: proposal, error: propError } = await supabase
        .from('event_date_proposals')
        .select('*')
        .eq('id', winningProposalId)
        .single();

    if (propError || !proposal) {
        console.error('Error fetching winning proposal:', propError?.message);
        return false;
    }

    const { error: updateError } = await supabase
        .from('events')
        .update({
            start_date: proposal.start_date,
            end_date: proposal.start_date,
            start_time: proposal.start_time,
            end_time: null,
            status: 'confirmed'
        })
        .eq('id', eventId);

    if (updateError) {
        console.error('Error confirming winning date:', updateError.message);
        return false;
    }
    return true;
}

export async function updateEvent(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<CalendarEvent>
): Promise<CalendarEvent | null> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.allDay !== undefined) dbUpdates.all_day = updates.allDay;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.privacy !== undefined) dbUpdates.privacy = updates.privacy;
    if (updates.recurrenceRule !== undefined) dbUpdates.recurrence_rule = updates.recurrenceRule;
    if (updates.recurrenceEnd !== undefined) dbUpdates.recurrence_end = updates.recurrenceEnd;
    if (updates.reminderMinutes !== undefined) dbUpdates.reminder_minutes = updates.reminderMinutes;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('updateEvent error:', error.message);
        return null;
    }

    return rowToEvent(data);
}

export async function deleteEvent(supabase: SupabaseClient, id: string): Promise<boolean> {
    const { error, count } = await supabase
        .from('events')
        .delete({ count: 'exact' })
        .eq('id', id);

    if (error) {
        console.error('deleteEvent error:', error.message);
        return false;
    }

    if (count === 0) {
        console.error('deleteEvent: aucune ligne supprimée (RLS ?). Event id:', id);
        return false;
    }

    return true;
}

// ------------------------------------------------------------------
// CHECKLIST QUERIES
// ------------------------------------------------------------------

export async function getEventChecklistItems(supabase: SupabaseClient, eventId: string): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
        .from('event_checklist_items')
        .select(`
            id,
            event_id,
            user_id,
            category,
            description,
            created_at,
            user:profiles(display_name, color, avatar_id)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('getEventChecklistItems error:', error.message);
        return [];
    }

    return data.map(item => ({
        id: item.id,
        eventId: item.event_id,
        userId: item.user_id,
        category: item.category as ChecklistCategory,
        description: item.description,
        createdAt: item.created_at,
        user: item.user ? {
            displayName: (item.user as any).display_name,
            color: (item.user as any).color,
            avatarId: (item.user as any).avatar_id
        } : undefined
    }));
}

export async function addChecklistItem(
    supabase: SupabaseClient,
    eventId: string,
    userId: string,
    category: ChecklistCategory,
    description: string | null
): Promise<boolean> {
    const { error } = await supabase
        .from('event_checklist_items')
        .insert({
            event_id: eventId,
            user_id: userId,
            category: category,
            description: description
        });

    if (error) {
        console.error('addChecklistItem error:', error.message);
        return false;
    }
    return true;
}

export async function deleteChecklistItem(supabase: SupabaseClient, itemId: string): Promise<boolean> {
    const { error, count } = await supabase
        .from('event_checklist_items')
        .delete({ count: 'exact' })
        .eq('id', itemId);

    if (error) {
        console.error('deleteChecklistItem error:', error.message);
        return false;
    }
    return count !== 0;
}
