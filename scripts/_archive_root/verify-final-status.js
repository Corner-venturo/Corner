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

async function verify() {
  console.log('Workspace ID Status Report:');
  console.log('');

  const results = {
    ready: [],
    needsFix: [],
    empty: []
  };

  for (const table of TABLES) {
    try {
      // Get total count
      const { count: total } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (total === 0) {
        results.empty.push(table);
        console.log(table + ': EMPTY (0 rows)');
        continue;
      }

      // Get count without workspace_id
      const { count: nullCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .is('workspace_id', null);

      if (nullCount === 0) {
        results.ready.push(table);
        console.log(table + ': READY (' + total + ' rows, all have workspace_id)');
      } else {
        results.needsFix.push({ table, nullCount, total });
        console.log(table + ': NEEDS FIX (' + nullCount + '/' + total + ' rows missing workspace_id)');
      }
    } catch (err) {
      console.log(table + ': ERROR - ' + err.message);
    }
  }

  console.log('');
  console.log('======================================');
  console.log('Summary:');
  console.log('======================================');
  console.log('Ready for RLS: ' + results.ready.length + ' tables');
  console.log('Empty tables: ' + results.empty.length + ' tables');
  console.log('Need fixing: ' + results.needsFix.length + ' tables');
  console.log('');

  if (results.needsFix.length > 0) {
    console.log('Tables that need fixing:');
    results.needsFix.forEach(({ table, nullCount, total }) => {
      console.log('  - ' + table + ': ' + nullCount + '/' + total + ' rows');
    });
  }
}

verify();
