import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkRLS() {
  // Check if RLS is enabled on tours
  const { data: tableInfo, error: tableError } = await supabase
    .from('tours')
    .select('id')
    .limit(1);

  console.log('Tours table access with service key:', tableInfo ? 'OK' : tableError);

  // Check current user context
  const { data: session } = await supabase.auth.getSession();
  console.log('Current session:', session?.session?.user?.id || 'No session');

  // Try to get helper function result
  const { data: wsData, error: wsError } = await supabase.rpc('get_current_user_workspace');
  console.log('get_current_user_workspace():', wsData || wsError?.message);

  // Check tours count
  const { count, error: countError } = await supabase
    .from('tours')
    .select('*', { count: 'exact', head: true });
  console.log('Tours count:', count, countError?.message || '');
}

checkRLS().catch(console.error);
