// 診斷整個系統的 ID 策略
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 診斷系統 ID 策略...\n');
  console.log('='.repeat(60));

  try {
    // 1. 檢查 employees 表
    console.log('\n📊 1. EMPLOYEES 表：');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_number, display_name')
      .limit(3);

    if (empError) {
      console.error('   ❌ 查詢失敗:', empError.message);
    } else if (employees && employees.length > 0) {
      console.log('   ✅ 找到員工資料:');
      employees.forEach(emp => {
        console.log(`      ID: ${emp.id}`);
        console.log(`      類型: ${typeof emp.id}`);
        console.log(`      長度: ${emp.id.length}`);
        console.log(`      格式: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(emp.id) ? 'UUID' : emp.id.match(/^\d+$/) ? '純數字/時間戳記' : 'TEXT'}`);
        console.log(`      編號: ${emp.employee_number}`);
        console.log(`      姓名: ${emp.display_name}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  沒有員工資料');
    }

    // 2. 檢查 workspaces 表
    console.log('\n📊 2. WORKSPACES 表：');
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .limit(1);

    if (workspaces && workspaces.length > 0) {
      console.log(`   ID: ${workspaces[0].id}`);
      console.log(`   格式: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaces[0].id) ? 'UUID' : 'TEXT'}`);
    }

    // 3. 檢查 channels 表
    console.log('\n📊 3. CHANNELS 表：');
    const { data: channels } = await supabase
      .from('channels')
      .select('id, name, tour_id')
      .limit(1);

    if (channels && channels.length > 0) {
      console.log(`   ID: ${channels[0].id}`);
      console.log(`   格式: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channels[0].id) ? 'UUID' : 'TEXT'}`);
      if (channels[0].tour_id) {
        console.log(`   tour_id: ${channels[0].tour_id}`);
        console.log(`   tour_id 格式: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channels[0].tour_id) ? 'UUID' : 'TEXT'}`);
      }
    }

    // 4. 檢查 tours 表
    console.log('\n📊 4. TOURS 表：');
    const { data: tours } = await supabase
      .from('tours')
      .select('id, code, name')
      .limit(1);

    if (tours && tours.length > 0) {
      console.log(`   ID: ${tours[0].id}`);
      console.log(`   格式: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tours[0].id) ? 'UUID' : 'TEXT'}`);
      console.log(`   code: ${tours[0].code}`);
    }

    // 5. 總結
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 系統 ID 策略總結：\n');

    console.log('當前狀況：');
    console.log(`   - employees.id: ${employees?.[0]?.id ? (/^[0-9a-f-]{36}$/i.test(employees[0].id) ? 'UUID ✅' : employees[0].id.match(/^\d+$/) ? '時間戳記 ⚠️' : 'TEXT ⚠️') : '未知'}`);
    console.log(`   - workspaces.id: ${workspaces?.[0]?.id ? 'UUID ✅' : '未知'}`);
    console.log(`   - channels.id: ${channels?.[0]?.id ? 'UUID ✅' : '未知'}`);
    console.log(`   - tours.id: ${tours?.[0]?.id ? (/^[0-9a-f-]{36}$/i.test(tours[0].id) ? 'UUID ✅' : 'TEXT ✅') : '未知'}`);
    console.log(`   - messages.author_id: UUID (預期接收 employees.id)`);

    console.log('\n❗ 問題診斷：');
    if (employees?.[0]?.id && !/^[0-9a-f-]{36}$/i.test(employees[0].id)) {
      console.log('   ⚠️  employees.id 不是 UUID 格式！');
      console.log('   ⚠️  但 messages.author_id 要求 UUID');
      console.log('   ⚠️  這導致訊息無法寫入');
      console.log('\n💡 解決方案：');
      console.log('   選項 A: 修改 messages.author_id 為 TEXT（配合 employees.id）');
      console.log('   選項 B: 修改 employees.id 為 UUID（需要資料轉換）');
      console.log('\n✅ 建議：選項 A - 因為系統已有大量 TEXT 格式的 employee ID');
    } else {
      console.log('   ✅ employees.id 是 UUID 格式');
      console.log('   ⚠️  但前端 user.id 卻是時間戳記？');
      console.log('   ⚠️  需要檢查登入邏輯');
    }

  } catch (error) {
    console.error('❌ 診斷失敗:', error.message);
    process.exit(1);
  }
}

diagnose();
