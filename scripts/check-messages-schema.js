// 檢查 messages 表結構
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 檢查 messages 表結構...\n');

  try {
    // 查詢表結構
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = 'messages'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      // 如果沒有 exec_sql RPC，用另一種方式
      console.log('⚠️  無法使用 RPC，嘗試直接查詢...');

      // 嘗試插入一條測試訊息看看錯誤
      const testMessage = {
        id: '00000000-0000-0000-0000-000000000001',
        channel_id: '00000000-0000-0000-0000-000000000002',
        author_id: 'TEST001', // TEXT 格式
        content: 'test',
        reactions: {},
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('messages')
        .insert(testMessage);

      if (insertError) {
        console.log('❌ 插入測試訊息失敗:');
        console.log('   錯誤:', insertError.message);
        console.log('   詳情:', insertError.details);
        console.log('   提示:', insertError.hint);
        console.log('   代碼:', insertError.code);
      } else {
        console.log('✅ 測試訊息插入成功 (author_id 支援 TEXT)');
        // 清理測試資料
        await supabase.from('messages').delete().eq('id', testMessage.id);
      }

      return;
    }

    console.log('📊 Messages 表結構:');
    data?.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(必填)' : ''}`);
    });

  } catch (error) {
    console.error('❌ 檢查失敗:', error.message);
  }
}

checkSchema();
