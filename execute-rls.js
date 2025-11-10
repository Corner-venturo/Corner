/**
 * 完整的 RLS 準備腳本
 * 為所有需要的表格新增 workspace_id 並填充資料
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

// 需要 workspace_id 的所有表格
const ISOLATED_TABLES = [
  'tours', 'orders', 'itineraries', 'todos', 'customers',
  'payments', 'payment_requests', 'disbursement_orders',
  'channels', 'messages', 'calendar_events',
  'quotes', 'contracts', 'contracts_tours',
  'tour_passengers', 'communication_records',
  'channel_groups', 'channel_members',
  'personal_canvases', 'rich_documents'
];

async function checkAndReport() {
  console.log('檢查所有表格的 workspace_id 狀態...\n');

  const results = {
    hasColumn: [],
    noColumn: [],
    hasData: [],
    noData: []
  };

  for (const table of ISOLATED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id, workspace_id')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist')) {
          results.noColumn.push(table);
          console.log('❌ ' + table.padEnd(30) + ' 缺少 workspace_id 欄位');
        } else {
          console.log('⚠️  ' + table.padEnd(30) + ' 錯誤: ' + error.message);
        }
      } else {
        results.hasColumn.push(table);
        if (data && data.length > 0 && data[0].workspace_id) {
          results.hasData.push(table);
          console.log('✅ ' + table.padEnd(30) + ' 有欄位且有資料');
        } else {
          results.noData.push(table);
          console.log('⚠️  ' + table.padEnd(30) + ' 有欄位但無資料');
        }
      }
    } catch (err) {
      console.log('❌ ' + table.padEnd(30) + ' 異常: ' + err.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('總結報告:');
  console.log('='.repeat(60));
  console.log('✅ 已完成 (有欄位有資料): ' + results.hasData.length + ' 個表格');
  console.log('⚠️  需填充 (有欄位無資料): ' + results.noData.length + ' 個表格');
  console.log('❌ 需新增 (缺少欄位):     ' + results.noColumn.length + ' 個表格');

  if (results.noColumn.length > 0) {
    console.log('\n需要新增欄位的表格:');
    results.noColumn.forEach(t => console.log('  - ' + t));
  }

  if (results.noData.length > 0) {
    console.log('\n需要填充資料的表格:');
    results.noData.forEach(t => console.log('  - ' + t));
  }
}

checkAndReport();
