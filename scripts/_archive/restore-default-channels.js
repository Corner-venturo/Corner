// 恢復預設頻道
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreDefaultChannels() {
  console.log('🔄 開始恢復預設頻道...\n');

  try {
    // 1. 取得「總部辦公室」工作空間
    console.log('🔍 查詢工作空間...');
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('name', '總部辦公室')
      .limit(1);

    if (wsError) throw wsError;

    let workspaceId;

    if (!workspaces || workspaces.length === 0) {
      // 建立工作空間
      console.log('📝 建立「總部辦公室」工作空間...');
      const { data: newWs, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name: '總部辦公室',
          description: 'Venturo 總部工作空間',
          icon: '🏢',
          is_active: true
        })
        .select()
        .single();

      if (createError) throw createError;
      workspaceId = newWs.id;
      console.log('✅ 工作空間已建立:', workspaceId, '\n');
    } else {
      workspaceId = workspaces[0].id;
      console.log('✅ 找到工作空間:', workspaceId, '\n');
    }

    // 2. 建立「一般討論」頻道
    console.log('📢 建立「一般討論」頻道...');
    const { data: generalChannel, error: generalError } = await supabase
      .from('channels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('name', '一般討論')
      .limit(1);

    if (generalError) throw generalError;

    if (!generalChannel || generalChannel.length === 0) {
      const { error: insertError } = await supabase
        .from('channels')
        .insert({
          workspace_id: workspaceId,
          name: '一般討論',
          description: '公司日常討論',
          type: 'public',
          is_favorite: false
        });

      if (insertError) throw insertError;
      console.log('✅ 「一般討論」頻道已建立\n');
    } else {
      console.log('ℹ️  「一般討論」頻道已存在\n');
    }

    // 3. 建立「公告」頻道
    console.log('📣 建立「公告」頻道...');
    const { data: announcementChannel, error: announcementError } = await supabase
      .from('channels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('name', '公告')
      .limit(1);

    if (announcementError) throw announcementError;

    if (!announcementChannel || announcementChannel.length === 0) {
      const { error: insertError } = await supabase
        .from('channels')
        .insert({
          workspace_id: workspaceId,
          name: '公告',
          description: '公司重要公告',
          type: 'public',
          is_favorite: true
        });

      if (insertError) throw insertError;
      console.log('✅ 「公告」頻道已建立\n');
    } else {
      console.log('ℹ️  「公告」頻道已存在\n');
    }

    // 4. 顯示結果
    const { data: allChannels } = await supabase
      .from('channels')
      .select('*')
      .eq('workspace_id', workspaceId);

    console.log('📊 當前頻道列表：');
    allChannels?.forEach(ch => {
      console.log(`   ${ch.is_favorite ? '⭐' : '  '} ${ch.name} (${ch.description})`);
    });

    console.log('\n✅ 預設頻道恢復完成！');

  } catch (error) {
    console.error('❌ 恢復失敗:', error.message);
    process.exit(1);
  }
}

restoreDefaultChannels();
