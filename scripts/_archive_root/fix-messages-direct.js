const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE',
  {
    db: {
      schema: 'public'
    }
  }
);

async function fixMessages() {
  console.log('Fixing messages table...');
  
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .order('created_at')
    .limit(1);

  const workspaceId = workspaces[0].id;
  console.log('Using workspace:', workspaceId);

  // Get all messages that need fixing
  const { data: messages, error: fetchError } = await supabase
    .from('messages')
    .select('id')
    .is('workspace_id', null);

  if (fetchError) {
    console.error('Error fetching messages:', fetchError.message);
    return;
  }

  console.log('Found', messages.length, 'messages to update');
  
  // Update each message individually to bypass trigger issues
  let success = 0;
  let failed = 0;

  for (const msg of messages) {
    const { error: updateError } = await supabase
      .from('messages')
      .update({ workspace_id: workspaceId }, { count: 'exact' })
      .eq('id', msg.id);

    if (updateError) {
      console.log('Failed to update message', msg.id, ':', updateError.message);
      failed++;
    } else {
      success++;
    }
  }

  console.log('');
  console.log('Results:');
  console.log('  Success:', success);
  console.log('  Failed:', failed);
}

fixMessages();
