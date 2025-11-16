#!/usr/bin/env node
/**
 * Venturo 資料庫診斷腳本
 * 檢查資料庫狀態、RLS、workspace_id 等
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnose() {
  console.log('=========================================');
  console.log('Venturo 資料庫健康檢查');
  console.log('=========================================\n');

  // 1. 檢查核心表格
  console.log('1. 核心表格資料統計');
  console.log('---');

  const coreTables = [
    'employees', 'workspaces', 'channels', 'messages',
    'todos', 'tours', 'orders', 'quotes', 'itineraries',
    'customers', 'calendar_events'
  ];

  for (const table of coreTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} 筆資料`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // 2. 檢查 workspace_id NULL 值
  console.log('\n2. workspace_id NULL 值檢查');
  console.log('---');

  const tablesWithWorkspace = [
    'employees', 'channels', 'tours', 'orders',
    'quotes', 'itineraries', 'customers', 'calendar_events'
  ];

  for (const table of tablesWithWorkspace) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .is('workspace_id', null);

      if (error) {
        console.log(`⚠️ ${table}: 無法檢查 (可能沒有 workspace_id 欄位)`);
      } else if (count === 0) {
        console.log(`✅ ${table}: 所有資料都有 workspace_id`);
      } else {
        console.log(`❌ ${table}: ${count} 筆資料缺少 workspace_id`);
      }
    } catch (err) {
      console.log(`⚠️ ${table}: ${err.message}`);
    }
  }

  // 3. 檢查 Workspaces
  console.log('\n3. Workspaces 資料');
  console.log('---');

  try {
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('id, name, code, created_at')
      .order('created_at');

    if (error) {
      console.log(`❌ 無法讀取 workspaces: ${error.message}`);
    } else if (!workspaces || workspaces.length === 0) {
      console.log('❌ 沒有任何 workspace！');
    } else {
      workspaces.forEach(w => {
        console.log(`  - ${w.name} (${w.code}) [ID: ${w.id.substring(0, 8)}...]`);
      });
    }
  } catch (err) {
    console.log(`❌ ${err.message}`);
  }

  // 4. 檢查 Employees 分佈
  console.log('\n4. Employees workspace 分佈');
  console.log('---');

  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, display_name, workspace_id');

    if (error) {
      console.log(`❌ 無法讀取 employees: ${error.message}`);
    } else {
      const distribution = {};
      employees.forEach(emp => {
        const wsId = emp.workspace_id || 'NULL';
        distribution[wsId] = (distribution[wsId] || 0) + 1;
      });

      Object.entries(distribution).forEach(([wsId, count]) => {
        if (wsId === 'NULL') {
          console.log(`  ❌ 未分配 workspace: ${count} 人`);
        } else {
          console.log(`  ✅ Workspace ${wsId.substring(0, 8)}...: ${count} 人`);
        }
      });
    }
  } catch (err) {
    console.log(`❌ ${err.message}`);
  }

  // 5. 檢查 Quotes items 資料
  console.log('\n5. Quotes Items 檢查');
  console.log('---');

  try {
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('id, code, items')
      .limit(10);

    if (error) {
      console.log(`❌ 無法讀取 quotes: ${error.message}`);
    } else {
      let emptyCount = 0;
      let hasDataCount = 0;

      quotes.forEach(q => {
        if (!q.items || (Array.isArray(q.items) && q.items.length === 0)) {
          emptyCount++;
        } else {
          hasDataCount++;
        }
      });

      console.log(`  ✅ 有 items 資料: ${hasDataCount} 筆`);
      if (emptyCount > 0) {
        console.log(`  ⚠️ items 為空: ${emptyCount} 筆`);
      }
    }
  } catch (err) {
    console.log(`❌ ${err.message}`);
  }

  // 6. 檢查 Channels 重複問題
  console.log('\n6. Channels 重複檢查');
  console.log('---');

  try {
    const { data: channels, error } = await supabase
      .from('channels')
      .select('id, name, workspace_id');

    if (error) {
      console.log(`❌ 無法讀取 channels: ${error.message}`);
    } else {
      const nameGroups = {};
      channels.forEach(ch => {
        const key = `${ch.name}:${ch.workspace_id}`;
        nameGroups[key] = (nameGroups[key] || 0) + 1;
      });

      const duplicates = Object.entries(nameGroups).filter(([_, count]) => count > 1);

      if (duplicates.length === 0) {
        console.log('  ✅ 沒有重複的頻道');
      } else {
        console.log(`  ⚠️ 發現 ${duplicates.length} 組重複頻道：`);
        duplicates.forEach(([key, count]) => {
          console.log(`    - ${key}: ${count} 個`);
        });
      }
    }
  } catch (err) {
    console.log(`❌ ${err.message}`);
  }

  // 7. 檢查 RLS Helper Functions (透過 RPC)
  console.log('\n7. RLS Helper Functions 檢查');
  console.log('---');

  try {
    // 嘗試呼叫 get_user_workspace_id
    const { data, error } = await supabase.rpc('get_user_workspace_id');
    if (error && error.message.includes('does not exist')) {
      console.log('  ❌ get_user_workspace_id 函數不存在');
    } else {
      console.log('  ✅ get_user_workspace_id 函數存在');
    }
  } catch (err) {
    console.log(`  ⚠️ get_user_workspace_id: ${err.message}`);
  }

  try {
    // 嘗試呼叫 is_super_admin
    const { data, error } = await supabase.rpc('is_super_admin');
    if (error && error.message.includes('does not exist')) {
      console.log('  ❌ is_super_admin 函數不存在');
    } else {
      console.log('  ✅ is_super_admin 函數存在');
    }
  } catch (err) {
    console.log(`  ⚠️ is_super_admin: ${err.message}`);
  }

  console.log('\n=========================================');
  console.log('診斷完成！');
  console.log('=========================================');
}

diagnose().catch(console.error);
