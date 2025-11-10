const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function fixMessages() {
  // Get workspace ID
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .order('created_at')
    .limit(1);

  if (!workspaces || workspaces.length === 0) {
    console.error('No workspace found');
    return;
  }

  const workspaceId = workspaces[0].id;
  console.log('Workspace ID:', workspaceId);

  // Use raw SQL via RPC to bypass triggers
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      UPDATE public.messages 
      SET workspace_id = '${workspaceId}'::uuid 
      WHERE workspace_id IS NULL;
    `
  });

  if (error) {
    console.error('RPC not available, trying direct query...');
    
    // Alternative: Get all messages and update them one by one
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('id')
      .is('workspace_id', null);

    if (fetchError) {
      console.error('Fetch error:', fetchError.message);
      return;
    }

    console.log('Found', messages.length, 'messages to update');
    console.log('This table has a trigger issue - needs manual SQL update');
    console.log('');
    console.log('Run this SQL manually in Supabase SQL Editor:');
    console.log('');
    console.log(`UPDATE public.messages SET workspace_id = '${workspaceId}'::uuid WHERE workspace_id IS NULL;`);
    
  } else {
    console.log('Messages updated successfully!');
  }
}

fixMessages();
