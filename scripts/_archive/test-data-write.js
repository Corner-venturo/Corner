#!/usr/bin/env node

/**
 * Phase 2 資料寫入測試腳本
 * 測試 Supabase 的 create/update/delete 操作
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 載入環境變數
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 錯誤：缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 測試結果統計
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, success, error = null) {
  results.total++;
  if (success) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    results.errors.push({ test: name, error });
    console.log(`❌ ${name}`);
    if (error) console.error(`   錯誤: ${error.message || error}`);
  }
}

/**
 * 測試 1: 建立 Tour
 */
async function testCreateTour() {
  console.log('\n📝 測試 1: 建立新旅遊團...');

  const testTour = {
    id: `tour-test-${Date.now()}`,
    code: `T${Date.now().toString().slice(-6)}`,
    name: '測試旅遊團 - 日本東京五日遊',
    location: '日本東京',
    departure_date: '2025-03-15',
    return_date: '2025-03-20',
    status: '提案',
    price: 45000,
    max_participants: 20,
    current_participants: 0,
    contract_status: '未簽署',
    total_revenue: 0,
    total_cost: 0,
    profit: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('tours')
      .insert([testTour])
      .select();

    if (error) throw error;

    logTest('建立 Tour', true);
    console.log(`   ID: ${data[0].id}`);
    console.log(`   團號: ${data[0].code}`);

    return data[0];
  } catch (error) {
    logTest('建立 Tour', false, error);
    return null;
  }
}

/**
 * 測試 2: 讀取 Tour
 */
async function testReadTour(tourId) {
  console.log('\n📖 測試 2: 讀取旅遊團資料...');

  try {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single();

    if (error) throw error;

    logTest('讀取 Tour', true);
    console.log(`   團名: ${data.name}`);
    console.log(`   狀態: ${data.status}`);

    return data;
  } catch (error) {
    logTest('讀取 Tour', false, error);
    return null;
  }
}

/**
 * 測試 3: 更新 Tour
 */
async function testUpdateTour(tourId) {
  console.log('\n✏️  測試 3: 更新旅遊團資料...');

  const updates = {
    current_participants: 5,
    status: '進行中',
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('tours')
      .update(updates)
      .eq('id', tourId)
      .select();

    if (error) throw error;

    logTest('更新 Tour', true);
    console.log(`   新狀態: ${data[0].status}`);
    console.log(`   參加人數: ${data[0].current_participants}`);

    return data[0];
  } catch (error) {
    logTest('更新 Tour', false, error);
    return null;
  }
}

/**
 * 測試 4: 建立 Order
 */
async function testCreateOrder(tourId) {
  console.log('\n📝 測試 4: 建立新訂單...');

  const testOrder = {
    id: `order-test-${Date.now()}`,
    code: `O${Date.now().toString().slice(-6)}`,
    tour_id: tourId,
    contact_phone: '0912345678',
    contact_person: '測試聯絡人',
    sales_person: 'william01',
    assistant: 'william01',
    member_count: 2,
    payment_status: '未收款',
    total_amount: 90000,
    paid_amount: 30000,
    remaining_amount: 60000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();

    if (error) throw error;

    logTest('建立 Order', true);
    console.log(`   訂單編號: ${data[0].code}`);
    console.log(`   聯絡人: ${data[0].contact_person}`);
    console.log(`   總金額: $${data[0].total_amount}`);

    return data[0];
  } catch (error) {
    logTest('建立 Order', false, error);
    return null;
  }
}

/**
 * 測試 5: 建立 Quote
 */
async function testCreateQuote() {
  console.log('\n📝 測試 5: 建立新報價單...');

  const testQuote = {
    id: `quote-test-${Date.now()}`,
    code: `Q${Date.now().toString().slice(-6)}`,
    customer_name: '測試客戶',
    destination: '韓國首爾',
    start_date: '2025-04-10',
    end_date: '2025-04-15',
    days: 5,
    nights: 4,
    number_of_people: 4,
    total_amount: 80000,
    status: '草稿',
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error} = await supabase
      .from('quotes')
      .insert([testQuote])
      .select();

    if (error) throw error;

    logTest('建立 Quote', true);
    console.log(`   報價號: ${data[0].code}`);
    console.log(`   目的地: ${data[0].destination}`);
    console.log(`   人數: ${data[0].number_of_people}`);

    return data[0];
  } catch (error) {
    logTest('建立 Quote', false, error);
    return null;
  }
}

/**
 * 測試 6: 刪除測試資料
 */
async function testDeleteData(tourId, orderId, quoteId) {
  console.log('\n🗑️  測試 6: 刪除測試資料...');

  // 刪除 Order
  if (orderId) {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      logTest('刪除 Order', true);
    } catch (error) {
      logTest('刪除 Order', false, error);
    }
  }

  // 刪除 Tour
  if (tourId) {
    try {
      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', tourId);

      if (error) throw error;
      logTest('刪除 Tour', true);
    } catch (error) {
      logTest('刪除 Tour', false, error);
    }
  }

  // 刪除 Quote
  if (quoteId) {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;
      logTest('刪除 Quote', true);
    } catch (error) {
      logTest('刪除 Quote', false, error);
    }
  }
}

/**
 * 主測試流程
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 VENTURO Phase 2 - 資料寫入測試');
  console.log('='.repeat(60));

  let createdTour = null;
  let createdOrder = null;
  let createdQuote = null;

  try {
    // 測試 Tour CRUD
    createdTour = await testCreateTour();
    if (createdTour) {
      await testReadTour(createdTour.id);
      await testUpdateTour(createdTour.id);
    }

    // 測試 Order 建立
    if (createdTour) {
      createdOrder = await testCreateOrder(createdTour.id);
    }

    // 測試 Quote 建立
    createdQuote = await testCreateQuote();

    // 清理測試資料
    await testDeleteData(
      createdTour?.id,
      createdOrder?.id,
      createdQuote?.id
    );

  } catch (error) {
    console.error('\n❌ 測試過程發生錯誤:', error);
  }

  // 顯示測試結果
  console.log('\n' + '='.repeat(60));
  console.log('📊 測試結果統計');
  console.log('='.repeat(60));
  console.log(`總測試數: ${results.total}`);
  console.log(`✅ 通過: ${results.passed}`);
  console.log(`❌ 失敗: ${results.failed}`);
  console.log(`成功率: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ 失敗的測試:');
    results.errors.forEach(({ test, error }) => {
      console.log(`   - ${test}`);
      console.log(`     ${error.message || error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // 如果有失敗的測試，返回錯誤碼
  process.exit(results.failed > 0 ? 1 : 0);
}

// 執行測試
runTests();
