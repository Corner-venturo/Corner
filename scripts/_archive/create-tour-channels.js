// 手動建立旅遊團頻道
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTourChannels() {
  console.log('🔄 開始建立旅遊團頻道...\n');

  try {
    // 1. 取得工作空間
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('name', '總部辦公室')
      .limit(1);

    if (wsError) throw wsError;

    if (!workspaces || workspaces.length === 0) {
      console.error('❌ 找不到工作空間');
      return;
    }

    const workspaceId = workspaces[0].id;
    console.log('✅ 工作空間:', workspaceId, '\n');

    // 2. 取得所有旅遊團
    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('id, code, name')
      .order('created_at', { ascending: true });

    if (toursError) throw toursError;

    if (!tours || tours.length === 0) {
      console.log('⚠️  沒有旅遊團資料');
      return;
    }

    console.log(`📊 找到 ${tours.length} 個旅遊團\n`);

    // 3. 為每個旅遊團建立頻道
    for (const tour of tours) {
      // 跳過資料不完整的團
      if (!tour.code || !tour.name || !tour.id) {
        console.log(`  ⏭️  跳過：${tour.code || '無代碼'} (資料不完整)`);
        continue;
      }

      // 檢查頻道是否已存在
      const { data: existing } = await supabase
        .from('channels')
        .select('id')
        .eq('tour_id', tour.id)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`  ℹ️  已存在：${tour.code} ${tour.name}`);
        continue;
      }

      // 建立頻道
      const { error: chError } = await supabase
        .from('channels')
        .insert({
          workspace_id: workspaceId,
          name: `${tour.code} ${tour.name}`,
          description: `${tour.name} 的專屬討論頻道`,
          type: 'public',
          tour_id: tour.id,
          is_favorite: false
        });

      if (chError) {
        console.error(`  ❌ 建立失敗：${tour.code} - ${chError.message}`);
      } else {
        console.log(`  ✅ 已建立：${tour.code} ${tour.name}`);
      }
    }

    console.log('\n✅ 旅遊團頻道建立完成！');

  } catch (error) {
    console.error('❌ 執行失敗:', error.message);
    process.exit(1);
  }
}

createTourChannels();
