#!/usr/bin/env node

/**
 * Phase 2 Store 整合測試
 * 測試前端 Store 與 Supabase 的整合
 * 使用 Supabase client 模擬前端 Store 的操作
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

// 清理測試資料
async function cleanup() {
  console.log('\n🗑️  清理測試資料...');

  try {
    // 刪除測試資料（以 test- 開頭的 ID）
    await supabase.from('orders').delete().like('id', 'test-%');
    await supabase.from('tours').delete().like('id', 'test-%');
    await supabase.from('quotes').delete().like('id', 'test-%');
    console.log('✅ 清理完成');
  } catch (error) {
    console.error('清理失敗:', error.message);
  }
}

/**
 * 測試 1: Store 讀取功能
 */
async function testStoreFetch() {
  console.log('\n📖 測試 1: Store 讀取功能\n');

  try {
    // 模擬 Store fetchAll
    const { data: tours, error: tourError } = await supabase
      .from('tours')
      .select('*')
      .order('created_at', { ascending: true });

    if (tourError) throw tourError;
    logTest('讀取 Tours', true);
    console.log(`   找到 ${tours.length} 筆資料`);

    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });

    if (orderError) throw orderError;
    logTest('讀取 Orders', true);
    console.log(`   找到 ${orders.length} 筆資料`);

    const { data: quotes, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: true });

    if (quoteError) throw quoteError;
    logTest('讀取 Quotes', true);
    console.log(`   找到 ${quotes.length} 筆資料`);

    return { tours, orders, quotes };
  } catch (error) {
    logTest('Store 讀取', false, error);
    return null;
  }
}

/**
 * 測試 2: Store 建立功能
 */
async function testStoreCreate() {
  console.log('\n📝 測試 2: Store 建立功能\n');

  const createdItems = {};

  try {
    // 建立 Tour (模擬 Store create)
    const timestamp = Date.now();
    const tourData = {
      id: `test-tour-${timestamp}`,
      code: `T${timestamp.toString().slice(-6)}`,
      name: '測試整合旅遊團',
      location: '測試地點',
      departure_date: '2025-12-01',
      return_date: '2025-12-05',
      status: '提案',
      price: 50000,
      max_participants: 20,
      contract_status: '未簽署',
      total_revenue: 0,
      total_cost: 0,
      profit: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .insert([tourData])
      .select()
      .single();

    if (tourError) throw tourError;
    createdItems.tour = tour;
    logTest('建立 Tour', true);
    console.log(`   Tour ID: ${tour.id}`);
    console.log(`   Tour Code: ${tour.code}`);

    // 建立 Order
    const orderData = {
      id: `test-order-${timestamp}`,
      code: `O${timestamp.toString().slice(-6)}`,
      tour_id: tour.id,
      contact_person: '測試聯絡人',
      contact_phone: '0912345678',
      sales_person: 'william01',
      assistant: 'william01',
      member_count: 2,
      payment_status: '未收款',
      total_amount: 100000,
      paid_amount: 0,
      remaining_amount: 100000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) throw orderError;
    createdItems.order = order;
    logTest('建立 Order', true);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Order Code: ${order.code}`);

    // 建立 Quote
    const quoteData = {
      id: `test-quote-${timestamp}`,
      code: `Q${timestamp.toString().slice(-6)}`,
      customer_name: '測試客戶',
      destination: '測試目的地',
      start_date: '2025-11-01',
      end_date: '2025-11-05',
      days: 4,
      nights: 3,
      number_of_people: 3,
      total_amount: 75000,
      status: '草稿',
      version: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert([quoteData])
      .select()
      .single();

    if (quoteError) throw quoteError;
    createdItems.quote = quote;
    logTest('建立 Quote', true);
    console.log(`   Quote ID: ${quote.id}`);
    console.log(`   Quote Code: ${quote.code}`);

    return createdItems;
  } catch (error) {
    logTest('Store 建立', false, error);
    return createdItems;
  }
}

/**
 * 測試 3: Store 更新功能
 */
async function testStoreUpdate(createdItems) {
  console.log('\n✏️  測試 3: Store 更新功能\n');

  try {
    if (!createdItems.tour) {
      console.log('   跳過：沒有 Tour 可更新');
      return;
    }

    // 更新 Tour (模擬 Store update)
    const { data: updatedTour, error: tourError } = await supabase
      .from('tours')
      .update({
        status: '進行中',
        current_participants: 15,
        updated_at: new Date().toISOString()
      })
      .eq('id', createdItems.tour.id)
      .select()
      .single();

    if (tourError) throw tourError;
    logTest('更新 Tour', true);
    console.log(`   新狀態: ${updatedTour.status}`);
    console.log(`   參加人數: ${updatedTour.current_participants}`);

    // 驗證更新
    const { data: verified, error: verifyError } = await supabase
      .from('tours')
      .select('*')
      .eq('id', createdItems.tour.id)
      .single();

    if (verifyError) throw verifyError;

    if (verified.status === '進行中' && verified.current_participants === 15) {
      logTest('驗證更新', true);
      console.log('   更新已確認');
    } else {
      throw new Error('更新驗證失敗：資料不一致');
    }

  } catch (error) {
    logTest('Store 更新', false, error);
  }
}

/**
 * 測試 4: Store 刪除功能
 */
async function testStoreDelete(createdItems) {
  console.log('\n🗑️  測試 4: Store 刪除功能\n');

  try {
    // 刪除 Order
    if (createdItems.order) {
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', createdItems.order.id);

      if (orderError) throw orderError;
      logTest('刪除 Order', true);
    }

    // 刪除 Quote
    if (createdItems.quote) {
      const { error: quoteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', createdItems.quote.id);

      if (quoteError) throw quoteError;
      logTest('刪除 Quote', true);
    }

    // 刪除 Tour
    if (createdItems.tour) {
      const { error: tourError } = await supabase
        .from('tours')
        .delete()
        .eq('id', createdItems.tour.id);

      if (tourError) throw tourError;
      logTest('刪除 Tour', true);
    }

    // 驗證刪除
    if (createdItems.tour) {
      const { data: verified } = await supabase
        .from('tours')
        .select('*')
        .eq('id', createdItems.tour.id)
        .single();

      if (!verified) {
        logTest('驗證刪除', true);
        console.log('   刪除已確認');
      } else {
        throw new Error('刪除驗證失敗：資料仍存在');
      }
    }

  } catch (error) {
    logTest('Store 刪除', false, error);
  }
}

/**
 * 主測試流程
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 VENTURO Phase 2 - Store 整合測試');
  console.log('='.repeat(60));

  // 清理舊測試資料
  await cleanup();

  // 執行測試
  const initialData = await testStoreFetch();
  const createdItems = await testStoreCreate();

  // 等待一下確保資料同步
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testStoreUpdate(createdItems);
  await testStoreDelete(createdItems);

  // 最終驗證
  console.log('\n📊 最終驗證\n');
  await testStoreFetch();

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

  // 最終清理
  await cleanup();

  process.exit(results.failed > 0 ? 1 : 0);
}

// 執行測試
runTests();
