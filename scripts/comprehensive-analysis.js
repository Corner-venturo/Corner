// 全面分析系統架構
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveAnalysis() {
  console.log('🔍 全面分析系統架構...\n');
  console.log('='.repeat(80));

  try {
    // 1. 檢查 employees 表結構
    console.log('\n📊 1. EMPLOYEES 表結構分析：\n');

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);

    if (empError) {
      console.error('   ❌ 查詢失敗:', empError.message);
      return;
    }

    if (employees && employees.length > 0) {
      const emp = employees[0];
      console.log('   欄位列表：');
      Object.keys(emp).forEach(key => {
        const value = emp[key];
        const type = typeof value;
        let format = type;

        if (key === 'id') {
          if (typeof value === 'string') {
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
              format = 'UUID ✅';
            } else if (/^\d+$/.test(value)) {
              format = '時間戳記 ⚠️';
            } else {
              format = 'TEXT ⚠️';
            }
          }
        }

        console.log(`   - ${key}: ${format} ${key === 'id' ? `(值: ${value})` : ''}`);
      });
    }

    // 2. 檢查所有引用 employees 的外鍵
    console.log('\n📊 2. 外鍵關係分析：\n');

    const tablesWithEmployeeRef = [
      'messages',
      'bulletins',
      'channels',
      'workspaces',
      'advance_lists',
      'advance_items',
      'orders',
      'payment_requests',
      'receipts'
    ];

    for (const table of tablesWithEmployeeRef) {
      const { data } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (data && data.length > 0) {
        const obj = data[0];
        const employeeFields = Object.keys(obj).filter(k =>
          k.includes('author') || k.includes('created_by') || k.includes('processed_by') ||
          k.includes('employee') || k.includes('user')
        );

        if (employeeFields.length > 0) {
          console.log(`   ${table}:`);
          employeeFields.forEach(field => {
            const value = obj[field];
            const type = typeof value;
            let format = type;

            if (value && typeof value === 'string') {
              if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                format = 'UUID';
              } else if (/^\d+$/.test(value)) {
                format = '時間戳記';
              } else {
                format = 'TEXT';
              }
            }

            console.log(`      - ${field}: ${format}`);
          });
        }
      }
    }

    // 3. 檢查是否有資料依賴時間戳記格式的 ID
    console.log('\n📊 3. 資料依賴分析：\n');

    const { count: empCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    console.log(`   - employees 總數: ${empCount || 0}`);

    // 檢查是否有其他表使用時間戳記格式的 employee_id
    const { data: orders } = await supabase
      .from('orders')
      .select('employee_id')
      .not('employee_id', 'is', null)
      .limit(5);

    if (orders && orders.length > 0) {
      console.log(`   - orders.employee_id 範例: ${orders[0].employee_id}`);
      console.log(`     格式: ${/^\d+$/.test(orders[0].employee_id) ? '時間戳記 ⚠️' : 'UUID ✅'}`);
    }

    // 4. 結論與建議
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 分析結論：\n');

    const empId = employees?.[0]?.id;
    const isTimestamp = empId && /^\d+$/.test(empId);

    if (isTimestamp) {
      console.log('❌ 發現架構性問題：employees.id 使用時間戳記格式');
      console.log('');
      console.log('🔍 問題根源：');
      console.log('   1. employees.id 應該是 UUID，但實際是時間戳記');
      console.log('   2. 這會導致所有引用 employees 的表無法正確建立外鍵');
      console.log('   3. 時間戳記 ID 有安全性問題（可預測）');
      console.log('');
      console.log('💡 正確的解決方案（架構重構）：');
      console.log('');
      console.log('   選項 A：將 employees.id 遷移到 UUID（推薦）✅');
      console.log('   --------------------------------------------------');
      console.log('   優點：');
      console.log('   - 符合 Supabase 最佳實踐');
      console.log('   - 更好的安全性');
      console.log('   - 統一的 ID 策略');
      console.log('   - 可以正確使用外鍵約束');
      console.log('');
      console.log('   步驟：');
      console.log('   1. 新增 uuid 欄位到 employees 表');
      console.log('   2. 為現有員工生成 UUID');
      console.log('   3. 更新所有引用 employee_id 的表');
      console.log('   4. 將 uuid 欄位改名為 id（移除舊的 id）');
      console.log('');
      console.log('   選項 B：保持時間戳記，修改所有引用表為 TEXT（不推薦）⚠️');
      console.log('   --------------------------------------------------');
      console.log('   缺點：');
      console.log('   - 違反 Supabase 最佳實踐');
      console.log('   - 安全性較差');
      console.log('   - 無法使用外鍵約束');
      console.log('   - 技術債累積');
      console.log('');
      console.log('📊 資料量評估：');
      console.log(`   - 現有員工數: ${empCount || 0}`);
      console.log(`   - 遷移複雜度: ${empCount && empCount > 100 ? '高' : empCount && empCount > 10 ? '中' : '低'}`);
      console.log('');
      console.log('✅ 建議：立即執行選項 A，現在遷移成本最低');
    } else {
      console.log('✅ employees.id 已經是 UUID 格式');
      console.log('   問題可能在前端登入邏輯，需要檢查為什麼 user.id 會變成時間戳記');
    }

  } catch (error) {
    console.error('❌ 分析失敗:', error.message);
    console.error(error);
  }
}

comprehensiveAnalysis();
