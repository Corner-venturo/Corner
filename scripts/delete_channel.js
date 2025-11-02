const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteChannel() {
  console.log('\n🔍 查詢「高中同學」頻道...\n');

  const { data: channels, error } = await supabase
    .from('channels')
    .select('*')
    .ilike('name', '%高中同學%');

  if (error) {
    console.error('❌ 查詢失敗:', error);
    return;
  }

  if (!channels || channels.length === 0) {
    console.log('❌ 找不到「高中同學」頻道');
    
    // 列出所有頻道
    const { data: allChannels } = await supabase
      .from('channels')
      .select('id, name, tour_id')
      .order('created_at');
    
    console.log('\n📋 目前所有頻道:');
    allChannels?.forEach((ch, idx) => {
      const tourLabel = ch.tour_id ? '[旅遊團]' : '';
      console.log('  ' + (idx + 1) + '. ' + ch.name + ' ' + tourLabel);
    });
    return;
  }

  console.log('✅ 找到頻道:');
  channels.forEach(ch => {
    console.log('  - ' + ch.name + ' (ID: ' + ch.id + ')');
    console.log('    tour_id: ' + (ch.tour_id || '無'));
    console.log('    type: ' + ch.type);
  });

  const channelToDelete = channels[0];
  console.log('\n🗑️ 準備刪除: ' + channelToDelete.name);

  // 1. 刪除相關的 messages
  const { error: msgError } = await supabase
    .from('messages')
    .delete()
    .eq('channel_id', channelToDelete.id);

  if (msgError) {
    console.warn('⚠️ 刪除訊息失敗:', msgError.message);
  } else {
    console.log('✅ 已刪除訊息');
  }

  // 2. 刪除相關的 channel_members
  const { error: memberError } = await supabase
    .from('channel_members')
    .delete()
    .eq('channel_id', channelToDelete.id);

  if (memberError) {
    console.warn('⚠️ 刪除成員失敗:', memberError.message);
  } else {
    console.log('✅ 已刪除成員');
  }

  // 3. 刪除 channel
  const { error: channelError } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelToDelete.id);

  if (channelError) {
    console.error('❌ 刪除頻道失敗:', channelError.message);
  } else {
    console.log('✅ 已刪除頻道: ' + channelToDelete.name);
  }
}

deleteChannel().catch(console.error);
