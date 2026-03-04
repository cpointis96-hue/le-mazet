import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'cpointis96@gmail.com',
        password: '123456789'
    });
    if (authError) return console.error("Auth error:", authError);

    // Create a new event and proposal to test
    const { data: event, error: eventErr } = await supabase.from('events').insert({
        user_id: authData.user.id,
        title: 'test event vote',
        status: 'proposed',
        is_multi_date: true,
        start_date: '2026-04-01',
        end_date: '2026-04-01'
    }).select().single();
    if (eventErr) return console.error("Event err:", eventErr);

    const { data: prop, error: propErr } = await supabase.from('event_date_proposals').insert({
        event_id: event.id,
        start_date: '2026-04-01',
        end_date: '2026-04-01'
    }).select().single();
    if (propErr) return console.error("Prop err:", propErr);

    const { data: upsertData, error: upsertErr } = await supabase
        .from('event_date_votes')
        .upsert({
            proposal_id: prop.id,
            user_id: authData.user.id,
            status: 'available'
        }, { onConflict: 'proposal_id,user_id' }).select();
    console.log("Upsert result:", JSON.stringify({ data: upsertData, error: upsertErr }, null, 2));

    const { data: fetchVotes, error: fetchErr } = await supabase
        .from('event_date_votes')
        .select(`
            id, proposal_id, user_id, status,
            proposal:proposal_id!inner(event_id),
            user:user_id(display_name, avatar_id)
        `).eq('proposal_id', prop.id);

    console.log("Fetched votes:", JSON.stringify({ votes: fetchVotes, error: fetchErr }, null, 2));
}

run().catch(console.error);
