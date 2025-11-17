/**
 * RLS 狀態檢查腳本
 * 檢查所有表格的 workspace_id 狀態
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

const TABLES = [
  'tours', 'orders', 'itineraries', 'todos', 'customers',
  'payments', 'payment_requests', 'disbursement_orders',
  'channels', 'messages', 'calendar_events'
];

async function check() {
  console.log('檢查表格 workspace_id 狀態...\n');

  for (const table of TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('id, workspace_id')
      .limit(1);

    if (error) {
      console.log(`❌ ${table.padEnd(25)} 錯誤: ${error.message}`);
    } else {
      const hasWorkspaceId = data?.[0]?.workspace_id ? '✅ 有' : '❌ 無';
      console.log(`${table.padEnd(25)} ${hasWorkspaceId}`);
    }
  }
}

check();
