import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function r() {
  const { data, error } = await supabase.rpc('query_publications', { 
    sql: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'events';" 
  });
  console.log("Policies via RPC:", data || error);

  // If RPC fails because we didn't deploy it, let's try direct service_role query if we can, or just use psql logic
}
r();
