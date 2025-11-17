/**
 * 清理快速報價單在 Supabase quote_items 表格的錯誤資料
 * 快速報價單的項目應該存在 quotes.quick_quote_items JSONB 欄位，而非 quote_items 表格
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ 請設定 SUPABASE_SERVICE_ROLE_KEY 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanQuickQuoteItems() {
  try {
    console.log('🧹 開始清理快速報價單的錯誤 quote_items 資料...\n');

    // 1. 查詢所有快速報價單
    const { data: quickQuotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, code, customer_name')
      .eq('quote_type', 'quick');

    if (quotesError) {
      throw quotesError;
    }

    console.log(`📋 找到快速報價單: ${quickQuotes.length} 筆`);
    quickQuotes.forEach(q => {
      console.log(`  - ${q.code}: ${q.customer_name}`);
    });

    if (quickQuotes.length === 0) {
      console.log('\n✅ 沒有快速報價單，無需清理');
      return;
    }

    const quickQuoteIds = quickQuotes.map(q => q.id);

    // 2. 查詢需要刪除的 quote_items
    const { data: itemsToDelete, error: itemsError } = await supabase
      .from('quote_items')
      .select('id, quote_id, description')
      .in('quote_id', quickQuoteIds);

    if (itemsError) {
      throw itemsError;
    }

    console.log(`\n🔴 找到需要刪除的 quote_items: ${itemsToDelete.length} 筆`);
    itemsToDelete.forEach(item => {
      console.log(`  - ${item.description} (quote_id: ${item.quote_id})`);
    });

    if (itemsToDelete.length === 0) {
      console.log('\n✅ 沒有需要刪除的 quote_items');
      return;
    }

    // 3. 刪除錯誤的 quote_items
    const { error: deleteError } = await supabase
      .from('quote_items')
      .delete()
      .in('quote_id', quickQuoteIds);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`\n✅ Supabase 清理完成！共刪除 ${itemsToDelete.length} 筆`);
    console.log('💡 快速報價單的項目現在只存在 quotes.quick_quote_items JSONB 欄位中');

  } catch (error) {
    console.error('\n❌ 清理失敗:', error.message);
    process.exit(1);
  }
}

cleanQuickQuoteItems();
