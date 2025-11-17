const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

const TABLES = [
  'tours', 'orders', 'itineraries', 'todos', 'customers',
  'payments', 'payment_requests', 'disbursement_orders',
  'quotes', 'channels', 'messages', 'calendar_events',
  'channel_members', 'channel_groups', 'personal_canvases',
  'rich_documents', 'employees'
];

async function fillWorkspaceData() {
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id')
    .order('created_at')
    .limit(1);

  if (wsError || !workspaces || workspaces.length === 0) {
    console.error('Error getting workspace:', wsError);
    return;
  }

  const defaultWorkspaceId = workspaces[0].id;
  console.log('Default workspace:', defaultWorkspaceId);
  console.log('');

  for (const table of TABLES) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .is('workspace_id', null);

      if (count === 0) {
        console.log(table + ': OK (0 rows to update)');
        continue;
      }

      const { data, error } = await supabase
        .from(table)
        .update({ workspace_id: defaultWorkspaceId })
        .is('workspace_id', null)
        .select();

      if (error) {
        console.error(table + ': ERROR - ' + error.message);
      } else {
        console.log(table + ': Updated ' + (data ? data.length : 0) + ' rows');
      }
    } catch (err) {
      console.error(table + ': EXCEPTION - ' + err.message);
    }
  }

  console.log('');
  console.log('Complete!');
}

fillWorkspaceData();
