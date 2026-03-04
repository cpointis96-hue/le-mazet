import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: 'cpointis96@gmail.com', password: '123456789' });
    if (authErr) { console.error("Auth err", authErr); return; }

    // Try delete an existing one maybe? Let's just create one properly
    const { data: ev, error: crErr } = await supabase.from('events').insert({
        user_id: auth.user.id,
        title: 'Delete Me Test',
        start_date: '2026-03-05',
        end_date: '2026-03-05',
        status: 'confirmed',
        privacy: 'public'
    }).select().single();

    if (crErr) { console.error("Create err", crErr); return; }

    console.log("Created event:", ev.id, "user_id:", ev.user_id, "auth uid:", auth.user.id);

    // Try delete
    const { data: delData, error: delErr, count } = await supabase.from('events').delete({ count: 'exact' }).eq('id', ev.id);
    console.log("Delete error:", delErr, "Count:", count);
}
run();
