/**
 * 清理重複的「總部辦公室」頻道
 *
 * 這個腳本會：
 * 1. 查詢所有名稱為「🏢 總部辦公室」的頻道
 * 2. 保留最舊的一筆（created_at 最早）
 * 3. 刪除其他重複的記錄
 * 4. 同時清理 IndexedDB 本地快取
 */

import { supabase } from '../src/lib/supabase/client';

async function cleanupDuplicateChannels() {
  console.log('🔍 開始檢查重複的「總部辦公室」頻道...\n');

  try {
    // 1. 查詢所有「總部辦公室」頻道
    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('name', '🏢 總部辦公室')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ 查詢失敗：', error);
      return;
    }

    if (!channels || channels.length === 0) {
      console.log('✅ 沒有找到「總部辦公室」頻道');
      return;
    }

    console.log(`📊 找到 ${channels.length} 個「總部辦公室」頻道\n`);

    if (channels.length === 1) {
      console.log('✅ 只有一個頻道，不需要清理');
      console.log(`   頻道 ID: ${channels[0].id}`);
      console.log(`   建立時間: ${channels[0].created_at}`);
      return;
    }

    // 2. 保留最舊的一筆
    const keepChannel = channels[0];
    const duplicates = channels.slice(1);

    console.log('📌 將保留以下頻道：');
    console.log(`   ID: ${keepChannel.id}`);
    console.log(`   建立時間: ${keepChannel.created_at}`);
    console.log(`   群組 ID: ${keepChannel.group_id}`);
    console.log(`   是否最愛: ${keepChannel.is_favorite}\n`);

    console.log(`🗑️  將刪除 ${duplicates.length} 個重複頻道：`);
    duplicates.forEach((channel, index) => {
      console.log(`   ${index + 1}. ID: ${channel.id}`);
      console.log(`      建立時間: ${channel.created_at}`);
    });

    // 3. 詢問是否確認刪除
    console.log('\n⚠️  請確認是否要執行刪除？');
    console.log('   如果要執行，請將 DRY_RUN 設為 false\n');

    const DRY_RUN = true; // 改成 false 才會真正刪除

    if (DRY_RUN) {
      console.log('🔒 DRY RUN 模式 - 不會實際刪除資料');
      console.log('   將 DRY_RUN 改為 false 後重新執行以實際刪除\n');
      return;
    }

    // 4. 刪除重複的頻道
    console.log('\n🚀 開始刪除重複頻道...\n');

    for (const channel of duplicates) {
      const { error: deleteError } = await supabase
        .from('channels')
        .delete()
        .eq('id', channel.id);

      if (deleteError) {
        console.error(`❌ 刪除失敗 (${channel.id}):`, deleteError);
      } else {
        console.log(`✅ 已刪除頻道: ${channel.id}`);
      }
    }

    console.log('\n✅ 清理完成！');
    console.log(`   保留: 1 個頻道`);
    console.log(`   刪除: ${duplicates.length} 個重複頻道\n`);

    // 5. 提示清理本地快取
    console.log('📝 後續步驟：');
    console.log('   1. 開啟瀏覽器開發者工具 (F12)');
    console.log('   2. Application → Storage → IndexedDB');
    console.log('   3. 刪除 venturo-db');
    console.log('   4. 重新整理頁面\n');

  } catch (error) {
    console.error('❌ 發生錯誤：', error);
  }
}

// 執行清理
cleanupDuplicateChannels();
