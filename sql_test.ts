import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function r() {
  const { data, error } = await supabase.rpc('query_publications', { 
    sql: "SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'" 
  });
  console.log("publications:", data || error);
}
r();
