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

    const { data: events } = await supabase.from('events').select('id, title, is_multi_date, status').order('created_at', { ascending: false }).limit(5);
    console.log("Latest events:", events);
    if (events && events.length > 0) {
        for (let e of events) {
            const { data: props } = await supabase.from('event_date_proposals').select('*').eq('event_id', e.id);
            console.log(`Event ${e.id} [${e.title}] proposals:`, props?.length);
            if (props && props.length > 0) console.dir(props);
        }
    }
}
run();
